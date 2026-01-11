import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildInMemoryApp } from "../src/http/app.js";
import type { ApiKeyStore } from "../src/services/apiKeyStore.js";
import type { VaultFactory } from "../src/services/vaultFactory.js";

describe("API Gateway auth & signal ingress", () => {
  let app: any;
  let apiKeyStore: ApiKeyStore;
  let vaultFactory: VaultFactory;

  beforeEach(() => {
    const built = buildInMemoryApp();
    app = built.app;
    apiKeyStore = built.apiKeyStore;
    vaultFactory = built.vaultFactory;
  });

  it("rejects requests without API key", async () => {
    const res = await request(app).post("/api/v1/signals").send({});
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("missing_api_key");
  });

  it("ingests signal and scopes tenant", async () => {
    const { apiKey, metadata } = await apiKeyStore.createKey("tenant-a", "primary");

    const signalPayload = {
      identity: {
        signalId: "sig-123",
        epochId: "epoch-1",
        market: "BTC-PERP",
        timeframe: "1h",
      },
      stages: {},
    };

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(signalPayload);

    expect(res.status).toBe(202);
    expect(res.body.signalId).toBe("sig-123");
    expect(res.body.tenantId).toBe("tenant-a");

    const vault = vaultFactory(metadata.tenantId);
    const stored = await vault.getBySignalId("sig-123");
    expect(stored?.identity.analystId).toBe("tenant-a");
  });

  it("enforces rate limits", async () => {
    const { apiKey } = await apiKeyStore.createKey("tenant-b", "limited", { limit: 1, windowSeconds: 60 });

    const payload = {
      identity: {
        signalId: "sig-rate-1",
        epochId: "epoch-1",
        market: "ETH-PERP",
        timeframe: "1h",
      },
      stages: {},
    };

    const first = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(payload);
    expect(first.status).toBe(202);

    const second = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send({ ...payload, identity: { ...payload.identity, signalId: "sig-rate-2" } });
    expect(second.status).toBe(429);
    expect(second.body.error).toBe("rate_limited");
  });

  it("revokes API keys", async () => {
    const { apiKey, metadata } = await apiKeyStore.createKey("tenant-c", "revocable");

    const revokeRes = await request(app)
      .post(`/api/v1/api-keys/${metadata.keyId}/revoke`)
      .set("x-api-key", apiKey)
      .send();
    expect(revokeRes.status).toBe(200);

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send({
        identity: {
          signalId: "sig-revoked",
          epochId: "epoch-1",
          market: "BTC-PERP",
          timeframe: "1h",
        },
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_api_key");
  });
});
