import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildInMemoryApp } from "../src/http/app.js";
import type { ApiKeyStore } from "../src/services/apiKeyStore.js";
import type { ReactorSubmission } from "../src/services/reactorSubmitter.js";

/**
 * Unit tests for the Gateway's submission boundary.
 *
 * The Reactor is faked here to drive its documented status codes. The fake
 * stands in for the Reactor's HTTP surface ONLY — never for persistence, which
 * the Gateway does not perform. The real Gateway→Reactor→afi-infra→MongoDB path
 * is proven against a real Reactor and real MongoDB in test/integration-boundary/.
 */

interface Call {
  tenantId: string;
  payload: any;
}

function fakeReactor(response: ReactorSubmission | (() => Promise<never>)) {
  const calls: Call[] = [];
  const submitter = async (tenantId: string, payload: any) => {
    calls.push({ tenantId, payload });
    if (typeof response === "function") return response();
    return response;
  };
  return { submitter, calls };
}

const OK_REACTOR: ReactorSubmission = {
  status: 200,
  body: {
    signalId: "sig-123",
    analystScore: { uwrScore: 0.8 },
    rawUss: { provenance: { providerId: "gateway:tenant-a" } },
    persistence: {
      outcome: "inserted",
      signalId: "sig-123",
      recordVersion: 1,
      lifecycleState: "SCORED",
    },
  },
};

const VALID_PAYLOAD = {
  symbol: "BTCUSDT",
  timeframe: "15m",
  strategy: "trend_pullback_v1",
  direction: "long",
  signalId: "sig-123",
};

describe("API Gateway auth & signal submission boundary", () => {
  let app: any;
  let apiKeyStore: ApiKeyStore;

  const build = (reactor: ReturnType<typeof fakeReactor>) => {
    const built = buildInMemoryApp(reactor.submitter);
    app = built.app;
    apiKeyStore = built.apiKeyStore;
    return reactor;
  };

  beforeEach(() => {
    build(fakeReactor(OK_REACTOR));
  });

  it("rejects requests without API key", async () => {
    const res = await request(app).post("/api/v1/signals").send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("missing_api_key");
  });

  it("forwards an authenticated submission to the reactor and echoes its outcome", async () => {
    const reactor = build(fakeReactor(OK_REACTOR));
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.signalId).toBe("sig-123");
    expect(res.body.tenantId).toBe("tenant-a");
    expect(res.body.persistence.outcome).toBe("inserted");

    // The reactor received the payload exactly once.
    expect(reactor.calls).toHaveLength(1);
    expect(reactor.calls[0].tenantId).toBe("tenant-a");
    expect(reactor.calls[0].payload.symbol).toBe("BTCUSDT");
  });

  it("does not restate scoring facts it does not own", async () => {
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");
    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    // Only the join key + persistence outcome are echoed.
    expect(res.body.analystScore).toBeUndefined();
    expect(res.body.rawUss).toBeUndefined();
    expect(Object.keys(res.body).sort()).toEqual(["persistence", "signalId", "tenantId"]);
  });

  it("never returns 202: an unscored submission is never acknowledged", async () => {
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");
    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);
    expect(res.status).not.toBe(202);
  });

  it("rejects payloads missing reactor-contract fields without calling the reactor", async () => {
    const reactor = build(fakeReactor(OK_REACTOR));
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send({ symbol: "BTCUSDT", timeframe: "15m" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_payload");
    expect(res.body.message).toContain("strategy");
    expect(res.body.message).toContain("direction");
    expect(reactor.calls).toHaveLength(0);
  });

  it("hands the reactor the caller's payload without adding to it", async () => {
    // The route itself must not enrich, default, or repair. (What the submitter
    // adds on the wire — authenticated provenance — is pinned in
    // reactor-submitter.test.ts, where the real outbound body is observable.)
    const reactor = build(fakeReactor(OK_REACTOR));
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    await request(app).post("/api/v1/signals").set("x-api-key", apiKey).send(VALID_PAYLOAD);

    expect(reactor.calls[0].payload).toEqual(VALID_PAYLOAD);
  });

  it("rejects a reactor 200 that carries no persistence evidence", async () => {
    // A 200 from something that is not the reactor's scoring surface (a proxy,
    // a health shim, a reactor predating canonical persistence) must never be
    // passed off to the caller as an acknowledgement.
    build(fakeReactor({ status: 200, body: {} }));
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("reactor_error");
    expect(res.body.persisted).toBe("unknown");
  });

  it("reports an unreadable reactor response as undetermined, never as not-persisted", async () => {
    // The reactor already answered and may have persisted; claiming
    // persisted:false here would invent a fact.
    build(fakeReactor({ status: 200, body: {}, bodyUnreadable: true }));
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("reactor_response_unreadable");
    expect(res.body.persisted).toBe("unknown");
    expect(res.body.persisted).not.toBe(false);
  });

  it("reports honest 503 when the reactor is unreachable", async () => {
    const reactor = build(
      fakeReactor(async () => {
        throw new Error("ECONNREFUSED");
      })
    );
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("reactor_unavailable");
    expect(res.body.persisted).toBe(false);
    expect(reactor.calls).toHaveLength(1);
  });

  it("passes through a conflicting duplicate as 409", async () => {
    build(
      fakeReactor({
        status: 409,
        body: {
          error: "evidence_persistence_conflict",
          signalId: "sig-123",
          persisted: false,
          message: "conflicting duplicate",
        },
      })
    );
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("evidence_persistence_conflict");
    expect(res.body.persisted).toBe(false);
  });

  it("passes through canonical store unavailability as 503", async () => {
    build(
      fakeReactor({
        status: 503,
        body: { error: "evidence_persistence_persistence", persisted: false },
      })
    );
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("evidence_persistence_unavailable");
    expect(res.body.persisted).toBe(false);
  });

  it("reports a failed UWR resolution (reactor 500) as an upstream fault, not success", async () => {
    build(
      fakeReactor({
        status: 500,
        body: { error: "evidence_persistence_construction", persisted: false },
      })
    );
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("reactor_error");
    expect(res.body.persisted).toBe(false);
  });

  it("does not blame the caller for the gateway's own bad reactor credential", async () => {
    build(fakeReactor({ status: 401, body: { error: "Unauthorized: invalid secret" } }));
    const { apiKey } = await apiKeyStore.createKey("tenant-a", "primary");

    const res = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);

    // 502, not 401: the caller's API key was valid.
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("reactor_auth_failed");
  });

  it("enforces rate limits", async () => {
    const { apiKey } = await apiKeyStore.createKey("tenant-b", "limited", {
      limit: 1,
      windowSeconds: 60,
    });

    const first = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send(VALID_PAYLOAD);
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/v1/signals")
      .set("x-api-key", apiKey)
      .send({ ...VALID_PAYLOAD, signalId: "sig-rate-2" });
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
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_api_key");
  });
});
