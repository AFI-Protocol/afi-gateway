import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createReactorSubmitter,
  createReactorSubmitterFromEnv,
  mapReactorStatus,
  projectReactorResponse,
  projectSubmission,
} from "../src/services/reactorSubmitter.js";

/**
 * The submitter is the Gateway's entire outbound surface. These tests pin the
 * two facts the boundary depends on: provenance is authenticated (not caller
 * supplied), and the shared secret travels in the BODY where the Reactor reads it.
 */

function captureFetch(status = 200, body: unknown = { signalId: "s1" }) {
  const calls: { url: string; init: any }[] = [];
  const fake = vi.fn(async (url: string, init: any) => {
    calls.push({ url, init });
    return {
      status,
      text: async () => JSON.stringify(body),
    } as any;
  });
  vi.stubGlobal("fetch", fake);
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AFI_REACTOR_BASE_URL;
  delete process.env.WEBHOOK_SHARED_SECRET;
});

describe("reactorSubmitter", () => {
  it("posts to the reactor's existing tradingview ingestion surface", async () => {
    const calls = captureFetch();
    const submit = createReactorSubmitter("http://reactor:8080");
    await submit("tenant-a", { symbol: "BTCUSDT" });

    expect(calls[0].url).toBe("http://reactor:8080/api/webhooks/tradingview");
    expect(calls[0].init.method).toBe("POST");
  });

  it("stamps authenticated provenance and overrides a caller-supplied providerId", async () => {
    const calls = captureFetch();
    const submit = createReactorSubmitter("http://reactor:8080");
    await submit("tenant-a", { symbol: "BTCUSDT", providerId: "spoofed-by-caller" });

    const sent = JSON.parse(calls[0].init.body);
    expect(sent.providerId).toBe("gateway:tenant-a");
  });

  it("sends the shared secret in the body, not a header", async () => {
    const calls = captureFetch();
    const submit = createReactorSubmitter("http://reactor:8080", "s3cret");
    await submit("tenant-a", { symbol: "BTCUSDT" });

    const sent = JSON.parse(calls[0].init.body);
    expect(sent.secret).toBe("s3cret");
    expect(calls[0].init.headers["x-webhook-secret"]).toBeUndefined();
  });

  it("omits the secret entirely when none is configured", async () => {
    const calls = captureFetch();
    const submit = createReactorSubmitter("http://reactor:8080");
    await submit("tenant-a", { symbol: "BTCUSDT" });

    expect(JSON.parse(calls[0].init.body).secret).toBeUndefined();
  });

  it("forwards a caller-supplied signalId verbatim and never mints one", async () => {
    const calls = captureFetch();
    const submit = createReactorSubmitter("http://reactor:8080");

    await submit("tenant-a", { symbol: "BTCUSDT", signalId: "caller-sig-1" });
    expect(JSON.parse(calls[0].init.body).signalId).toBe("caller-sig-1");

    await submit("tenant-a", { symbol: "BTCUSDT" });
    // No signalId invented — the Reactor remains the identity authority.
    expect(JSON.parse(calls[1].init.body).signalId).toBeUndefined();
  });

  it("adds authenticated provenance and nothing else to the outbound body", async () => {
    const calls = captureFetch();
    const submit = createReactorSubmitter("http://reactor:8080");
    const input = {
      symbol: "BTCUSDT",
      timeframe: "15m",
      strategy: "trend_pullback_v1",
      direction: "long",
    };
    await submit("tenant-a", input);

    const sent = JSON.parse(calls[0].init.body);
    // Exhaustive, not a denylist: the outbound body is the caller's payload
    // plus providerId — no invented scoring fact can hide here.
    expect(Object.keys(sent).sort()).toEqual([...Object.keys(input), "providerId"].sort());
  });

  it("adds only provenance and the secret when a secret is configured", async () => {
    const calls = captureFetch();
    const submit = createReactorSubmitter("http://reactor:8080", "s3cret");
    const input = { symbol: "BTCUSDT", timeframe: "15m", strategy: "s", direction: "long" };
    await submit("tenant-a", input);

    const sent = JSON.parse(calls[0].init.body);
    expect(Object.keys(sent).sort()).toEqual(
      [...Object.keys(input), "providerId", "secret"].sort()
    );
  });

  it("marks an unreadable response body rather than throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 200,
        text: async () => {
          throw new TypeError("terminated: aborted socket");
        },
      }))
    );
    const submit = createReactorSubmitter("http://reactor:8080");
    const out = await submit("tenant-a", { symbol: "BTCUSDT" });

    // The reactor answered; only the body read failed. The outcome is unknown.
    expect(out.bodyUnreadable).toBe(true);
    expect(out.status).toBe(200);
  });

  it("fails closed when no reactor URL is configured", () => {
    expect(() => createReactorSubmitterFromEnv()).toThrow(/AFI_REACTOR_BASE_URL is required/);
  });

  it("builds from env when configured", async () => {
    process.env.AFI_REACTOR_BASE_URL = "http://reactor:9090";
    const calls = captureFetch();
    const submit = createReactorSubmitterFromEnv();
    await submit("tenant-a", { symbol: "BTCUSDT" });
    expect(calls[0].url).toBe("http://reactor:9090/api/webhooks/tradingview");
  });
});

describe("mapReactorStatus", () => {
  it("maps the reactor's documented statuses honestly", () => {
    expect(mapReactorStatus(200)).toBe(200);
    expect(mapReactorStatus(400)).toBe(400);
    expect(mapReactorStatus(401)).toBe(502); // gateway's credential, not caller's
    expect(mapReactorStatus(409)).toBe(409);
    expect(mapReactorStatus(422)).toBe(422);
    expect(mapReactorStatus(500)).toBe(502);
    expect(mapReactorStatus(503)).toBe(503);
  });

  it("never maps any reactor status to a success the reactor did not report", () => {
    for (const status of [201, 202, 301, 400, 401, 403, 404, 409, 418, 422, 500, 502, 503, 504]) {
      expect(mapReactorStatus(status)).not.toBe(200);
      expect(mapReactorStatus(status)).not.toBe(202);
    }
  });
});

describe("projectReactorResponse", () => {
  it("echoes only the join key and persistence outcome on success", () => {
    const out = projectReactorResponse(
      200,
      {
        signalId: "s1",
        analystScore: { uwrScore: 0.9 },
        rawUss: {},
        decayParams: {},
        persistence: { outcome: "inserted", recordVersion: 1 },
      },
      "tenant-a"
    );
    expect(Object.keys(out).sort()).toEqual(["persistence", "signalId", "tenantId"]);
  });

  it("marks every failure as not persisted", () => {
    for (const status of [400, 401, 409, 422, 500, 503]) {
      const out = projectReactorResponse(status, { error: "x" }, "tenant-a");
      expect(out.persisted).toBe(false);
    }
  });
});

describe("projectSubmission", () => {
  const GOOD = {
    status: 200,
    body: { signalId: "s1", persistence: { outcome: "inserted", recordVersion: 1 } },
  };

  it("acknowledges only a 200 that carries real persistence evidence", () => {
    const out = projectSubmission(GOOD, "tenant-a");
    expect(out.status).toBe(200);
    expect(out.body.signalId).toBe("s1");
  });

  it("refuses to acknowledge a 200 with no persistence evidence", () => {
    // An empty 200, a non-JSON 200, a 200 with a signalId but no persistence
    // block — none of these prove a canonical record exists.
    for (const body of [{}, { message: "<html>OK</html>" }, { signalId: "s1" }, null]) {
      const out = projectSubmission({ status: 200, body }, "tenant-a");
      expect(out.status).toBe(502);
      expect(out.body.persisted).toBe("unknown");
    }
  });

  it("never reports an unreadable response as not-persisted", () => {
    const out = projectSubmission({ status: 200, body: {}, bodyUnreadable: true }, "tenant-a");
    expect(out.status).toBe(502);
    expect(out.body.error).toBe("reactor_response_unreadable");
    expect(out.body.persisted).toBe("unknown");
  });

  it("never emits 200 or 202 for any non-evidenced reactor answer", () => {
    for (const status of [201, 202, 400, 401, 409, 422, 500, 502, 503, 504]) {
      const out = projectSubmission({ status, body: { error: "x" } }, "tenant-a");
      expect(out.status).not.toBe(200);
      expect(out.status).not.toBe(202);
    }
  });
});
