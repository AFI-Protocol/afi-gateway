import express, { Request, Response } from "express";
import { elizaLogger } from "@elizaos/core";
import type { ApiKeyStore } from "../services/apiKeyStore.js";
import { MongoApiKeyStore, InMemoryApiKeyStore, getDefaultRateLimit } from "../services/apiKeyStore.js";
import type { VaultFactory } from "../services/vaultFactory.js";
import { createVaultFactoryFromEnv, createInMemoryVaultFactory } from "../services/vaultFactory.js";
import { apiKeyAuthMiddleware, createRateLimiter, type AuthedRequest } from "../middleware/apiKeyAuth.js";
import type { VaultedSignalRecord } from "afi-infra/src/tssd/types.js";

export interface AppDeps {
  apiKeyStore?: ApiKeyStore;
  vaultFactory?: VaultFactory;
}

function normalizeSignalPayload(payload: any): { valid: true; record: VaultedSignalRecord } | { valid: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return { valid: false, message: "payload must be an object" };
  }

  const identity = payload.identity ?? {};
  const required = ["signalId", "epochId", "market", "timeframe"];
  const missing = required.filter((k) => !identity[k]);
  if (missing.length > 0) {
    return { valid: false, message: `identity is missing: ${missing.join(", ")}` };
  }

  const now = new Date().toISOString();
  const record: VaultedSignalRecord = {
    identity: {
      signalId: identity.signalId,
      epochId: identity.epochId,
      market: identity.market,
      timeframe: identity.timeframe,
      strategyId: identity.strategyId,
      scoutId: identity.scoutId,
      analystId: identity.analystId,
      validatorId: identity.validatorId,
    },
    stages: payload.stages ?? {},
    publicSurface:
      payload.publicSurface ?? {
        keyDrivers: [],
        summaryInsight: "",
        tags: [],
      },
    proprietaryDetail: payload.proprietaryDetail,
    training: payload.training ?? {},
    createdAt: payload.createdAt ?? now,
    updatedAt: payload.updatedAt ?? now,
  };

  return { valid: true, record };
}

export function buildApp(deps: AppDeps = {}) {
  const app = express();
  app.use(express.json());

  // Dependencies
  const apiKeyStore = deps.apiKeyStore ?? new MongoApiKeyStore();
  const vaultFactory = deps.vaultFactory ?? createVaultFactoryFromEnv();
  const rateLimiter = createRateLimiter(getDefaultRateLimit());
  const auth = apiKeyAuthMiddleware({ apiKeyStore, rateLimiter });

  // Basic logging
  app.use((req, _res, next) => {
    elizaLogger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health
  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", service: "afi-gateway" });
  });

  // API key management (tenant scoped)
  app.post("/api/v1/api-keys", auth, async (req: AuthedRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId;
      if (!tenantId) return res.status(500).json({ error: "missing_tenant_context" });

      const { label, rateLimit } = req.body ?? {};
      const created = await apiKeyStore.createKey(tenantId, label, rateLimit);
      return res.status(201).json(created);
    } catch (err) {
      elizaLogger.error("[api-keys:create] error", err);
      return res.status(500).json({ error: "api_key_create_failed" });
    }
  });

  app.get("/api/v1/api-keys", auth, async (req: AuthedRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId;
      if (!tenantId) return res.status(500).json({ error: "missing_tenant_context" });
      const keys = await apiKeyStore.listKeys(tenantId);
      return res.status(200).json({ items: keys });
    } catch (err) {
      elizaLogger.error("[api-keys:list] error", err);
      return res.status(500).json({ error: "api_key_list_failed" });
    }
  });

  app.post("/api/v1/api-keys/:keyId/revoke", auth, async (req: AuthedRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId;
      if (!tenantId) return res.status(500).json({ error: "missing_tenant_context" });
      const { keyId } = req.params;
      const ok = await apiKeyStore.revokeKey(tenantId, keyId);
      if (!ok) return res.status(404).json({ error: "not_found" });
      return res.status(200).json({ revoked: true });
    } catch (err) {
      elizaLogger.error("[api-keys:revoke] error", err);
      return res.status(500).json({ error: "api_key_revoke_failed" });
    }
  });

  // Signal ingest - tenant scoped
  app.post("/api/v1/signals", auth, async (req: AuthedRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId;
      if (!tenantId) return res.status(500).json({ error: "missing_tenant_context" });

      const parsed = normalizeSignalPayload(req.body);
      if (!parsed.valid) {
        return res.status(400).json({ error: "invalid_payload", message: parsed.message });
      }

      const vault = vaultFactory(tenantId);
      await vault.upsert(parsed.record);

      return res.status(202).json({ status: "accepted", tenantId, signalId: parsed.record.identity.signalId });
    } catch (err) {
      elizaLogger.error("[signals] error", err);
      return res.status(500).json({ error: "signal_ingest_failed" });
    }
  });

  // 404
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "not_found", path: req.path });
  });

  return { app, apiKeyStore, vaultFactory };
}

// Convenience for tests
export function buildInMemoryApp() {
  return buildApp({
    apiKeyStore: new InMemoryApiKeyStore(),
    vaultFactory: createInMemoryVaultFactory(),
  });
}
