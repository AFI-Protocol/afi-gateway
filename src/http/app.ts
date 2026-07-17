import express, { Request, Response } from "express";
import { elizaLogger } from "@elizaos/core";
import type { ApiKeyStore } from "../services/apiKeyStore.js";
import { MongoApiKeyStore, InMemoryApiKeyStore, getDefaultRateLimit } from "../services/apiKeyStore.js";
import type { ReactorSubmitter } from "../services/reactorSubmitter.js";
import {
  createReactorSubmitterFromEnv,
  projectSubmission,
} from "../services/reactorSubmitter.js";
import { apiKeyAuthMiddleware, createRateLimiter, type AuthedRequest } from "../middleware/apiKeyAuth.js";

export interface AppDeps {
  apiKeyStore?: ApiKeyStore;
  reactorSubmitter?: ReactorSubmitter;
}

/**
 * Presence-only check on the Reactor's ingestion contract.
 *
 * This is deliberately NOT validation: the Reactor remains the sole authority on
 * whether a payload is a valid signal. The Gateway only refuses what it can see
 * is unsendable, and never repairs, defaults, or enriches a field — inventing a
 * missing `strategy` or `direction` would be fabricating a scoring fact.
 */
const REQUIRED_FIELDS = ["symbol", "timeframe", "strategy", "direction"] as const;

function checkSubmittable(payload: any): { ok: true } | { ok: false; message: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "payload must be an object" };
  }
  const missing = REQUIRED_FIELDS.filter((f) => !payload[f]);
  if (missing.length > 0) {
    return { ok: false, message: `missing required field(s): ${missing.join(", ")}` };
  }
  return { ok: true };
}

export function buildApp(deps: AppDeps = {}) {
  const app = express();
  app.use(express.json());

  // Dependencies
  const apiKeyStore = deps.apiKeyStore ?? new MongoApiKeyStore();
  const reactorSubmitter = deps.reactorSubmitter ?? createReactorSubmitterFromEnv();
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

  // Signal submission — tenant scoped, forwarded to the Reactor.
  //
  // The Gateway authenticates the caller, stamps provenance from the API key's
  // tenant, and hands the raw payload to the Reactor. It stores nothing. The
  // response reports what the Reactor actually did; a submission is only ever
  // acknowledged once one canonical stamped evidence record genuinely exists.
  //
  // `signalId` is the canonical join key: forwarded verbatim when the caller
  // supplies one, otherwise minted by the Reactor and echoed back here. The
  // Gateway never mints it. NOTE: a caller who omits `signalId` gets a
  // Reactor-generated, timestamped id, so each POST is a distinct record and is
  // NOT idempotent — idempotency requires a caller-supplied `signalId`. The
  // Gateway deliberately does not compensate with dedupe caches or retries.
  app.post("/api/v1/signals", auth, async (req: AuthedRequest, res: Response) => {
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) return res.status(500).json({ error: "missing_tenant_context" });

    const submittable = checkSubmittable(req.body);
    if (!submittable.ok) {
      return res.status(400).json({ error: "invalid_payload", message: submittable.message });
    }

    let submission;
    try {
      submission = await reactorSubmitter(tenantId, req.body);
    } catch (err) {
      // The Reactor never answered, so nothing was scored and nothing was
      // persisted. Say exactly that — never queue, downgrade, or accept.
      elizaLogger.error("[signals] reactor unreachable", err);
      return res.status(503).json({
        error: "reactor_unavailable",
        persisted: false,
        message: "Reactor is unreachable; the submission was not scored or persisted.",
      });
    }

    const projected = projectSubmission(submission, tenantId);
    return res.status(projected.status).json(projected.body);
  });

  // 404
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "not_found", path: req.path });
  });

  return { app, apiKeyStore, reactorSubmitter };
}

/**
 * Convenience for unit tests: an in-memory API key store plus a caller-supplied
 * fake Reactor. The fake stands in for the Reactor's HTTP surface ONLY — it is
 * never a stand-in for persistence, which the Gateway does not perform. The
 * real Gateway→Reactor→afi-infra→MongoDB path is proven against a real Reactor
 * and real MongoDB in test/integration-boundary/.
 */
export function buildInMemoryApp(reactorSubmitter: ReactorSubmitter) {
  return buildApp({
    apiKeyStore: new InMemoryApiKeyStore(),
    reactorSubmitter,
  });
}
