/**
 * MONGO-GATEWAY-BOUNDARY (Slot 4) — REAL cross-repository boundary proof.
 *
 * Drives the COMPILED Gateway build (dist/src/http/app.js) against a REAL
 * afi-reactor process, which submits through the REAL packaged afi-infra store
 * into a REAL MongoDB. No fakes anywhere in this file: the only stand-ins
 * permitted in this repo live in tests/ (unit tests).
 *
 * Proves, end to end:
 *   P1  A valid Gateway submission reaches the Reactor through the intended
 *       boundary and results in ONE canonical stamped evidence record.
 *   P2  The evidence is constructed by the REACTOR, not the Gateway (the record
 *       carries scoring facts the Gateway never possessed).
 *   P3  Provenance is authenticated by the Gateway, not fabricated, and a
 *       caller cannot spoof it.
 *   P4  Repeating the same canonical request preserves idempotency.
 *   P5  A conflicting duplicate preserves the existing 409 conflict behavior
 *       and leaves the stored record untouched (append-once).
 *   P6  Invalid raw input creates no canonical evidence.
 *   P7  Reactor unavailable creates no canonical evidence and fails honestly.
 *   P8  Failed UWR resolution creates no canonical evidence.
 *   P9  No old or alternate Gateway scored-signal collection is ever created.
 *   P10 The Gateway's operational plane holds no scored-signal data.
 *
 * Requires a real MongoDB (MONGODB_URI) and a built afi-reactor checkout
 * (AFI_REACTOR_DIR). Fails loudly if either is missing.
 */

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import request from "supertest";
import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error(
    "FATAL: MONGODB_URI is required — this is a real-MongoDB cross-repository proof, not a mock."
  );
  process.exit(1);
}

const REACTOR_DIR = process.env.AFI_REACTOR_DIR;
if (!REACTOR_DIR) {
  console.error(
    "FATAL: AFI_REACTOR_DIR is required — this proof drives a REAL afi-reactor, not a stub."
  );
  process.exit(1);
}

const EVIDENCE_DB = process.env.AFI_EVIDENCE_DB_NAME ?? "afi_gateway_boundary_it";
const OPERATIONAL_DB = process.env.AFI_MONGO_DB_NAME ?? "afi_eliza_it";
const EVIDENCE_COLLECTION = "scored_signal_evidence";
const EVIDENCE_SCHEMA = "afi.scored-signal-evidence.v1";
const SHARED_SECRET = "boundary-it-shared-secret";

const GOOD_PORT = 18080;
const BAD_UWR_PORT = 18081;
const DEAD_PORT = 1; // nothing listens here: a genuine ECONNREFUSED

let passed = 0;
const ok = (label) => {
  passed += 1;
  console.log(`  ✅ ${label}`);
};

const children = [];

function spawnReactor(port, extraEnv) {
  const child = spawn(process.execPath, ["dist/src/server.js"], {
    cwd: REACTOR_DIR, // the Reactor resolves governed config relative to its cwd
    env: {
      ...process.env,
      NODE_ENV: "production", // NOT "test" — else the compiled server never listens
      PORT: String(port),
      AFI_EVIDENCE_MONGODB_URI: URI,
      AFI_EVIDENCE_DB_NAME: EVIDENCE_DB,
      AFI_PRICE_FEED_SOURCE: "demo", // hermetic: never depend on a live feed
      WEBHOOK_SHARED_SECRET: SHARED_SECRET,
      ...extraEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  const log = [];
  child.stdout.on("data", (d) => log.push(String(d)));
  child.stderr.on("data", (d) => log.push(String(d)));
  child.on("exit", (code) => log.push(`[reactor:${port} exited ${code}]`));
  return { child, log };
}

async function waitForHealth(port, log, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`reactor on :${port} never became healthy.\n${log.join("")}`);
}

function evidenceCollection(client) {
  return client.db(EVIDENCE_DB).collection(EVIDENCE_COLLECTION);
}

async function main() {
  const client = new MongoClient(URI);
  await client.connect();

  // Start from a genuinely clean slate so every count below is meaningful.
  await client.db(EVIDENCE_DB).dropDatabase();
  await client.db(OPERATIONAL_DB).dropDatabase();
  await client.db("afi_tssd").dropDatabase();

  const { log: goodLog } = spawnReactor(GOOD_PORT, {});
  await waitForHealth(GOOD_PORT, goodLog);
  ok("real afi-reactor is up against real MongoDB");

  // ---- Build the COMPILED gateway app pointed at the real reactor ----
  process.env.AFI_REACTOR_BASE_URL = `http://127.0.0.1:${GOOD_PORT}`;
  process.env.WEBHOOK_SHARED_SECRET = SHARED_SECRET;
  process.env.AFI_MONGO_DB_NAME = OPERATIONAL_DB;

  const appModule = pathToFileURL(path.resolve(process.cwd(), "dist/src/http/app.js")).href;
  const { buildApp } = await import(appModule);

  // The real MongoApiKeyStore (operational plane) + the real reactor submitter.
  const { app, apiKeyStore } = buildApp();
  await apiKeyStore.ensureIndexes();
  const { apiKey } = await apiKeyStore.createKey("tenant-a", "boundary-it");

  const signalId = "gw-boundary-it-1";
  const payload = {
    signalId,
    symbol: "BTCUSDT",
    timeframe: "15m",
    strategy: "trend_pullback_v1",
    direction: "long",
  };

  // ---- P1: a valid submission produces ONE canonical stamped record ----
  const res1 = await request(app).post("/api/v1/signals").set("x-api-key", apiKey).send(payload);
  assert.equal(res1.status, 200, `expected 200, got ${res1.status}: ${JSON.stringify(res1.body)}`);
  assert.notEqual(res1.status, 202, "the gateway must never merely 'accept' a signal");
  assert.equal(res1.body.signalId, signalId, "gateway echoes the reactor's signalId join key");
  assert.equal(res1.body.persistence.outcome, "inserted");

  const count1 = await evidenceCollection(client).countDocuments({ signalId });
  assert.equal(count1, 1, "exactly one canonical evidence record");
  ok("P1 valid gateway submission -> reactor -> afi-infra -> ONE canonical record in real MongoDB");

  // ---- P2: the record was constructed by the REACTOR, not the gateway ----
  const record = await evidenceCollection(client).findOne({ signalId });
  assert.equal(record.schema, EVIDENCE_SCHEMA, "governed evidence schema");
  assert.equal(record.signalId, signalId, "signalId is the canonical join key");
  assert.equal(record.lifecycleState, "SCORED");
  assert.equal(record.analystId, "froggy", "reactor-owned analyst identity");
  assert.equal(record.strategyId, "trend_pullback_v1", "reactor-owned strategy identity");
  assert.ok(record.scoredSignal, "reactor-built scored-signal projection");
  assert.ok(record.provenanceRecord, "reactor-built provenance record");
  // The UWR stamp is decisive: the gateway has no UWR code, config, or registry,
  // so a stamped record can only have been constructed by the reactor.
  assert.ok(record.uwrProfile, "governed UWR stamp present");
  assert.equal(record.uwrProfile.source, "builtin-value-identity", "RC-6 source discriminator");
  assert.ok(record.uwrProfile.profileId, "stamped profile identity");
  // Concrete scoring facts the gateway has no code to compute.
  assert.equal(record.scoredSignal.schema, "afi.scored-signal.v1", "thin projection schema");
  assert.equal(typeof record.scoredSignal.uwrScore, "number", "reactor-computed UWR score");
  assert.ok(record.scoredSignal.uwrAxes, "reactor-computed UWR axes");
  for (const axis of ["structure", "execution", "risk", "insight"]) {
    assert.equal(
      typeof record.scoredSignal.uwrAxes[axis],
      "number",
      `reactor-computed uwrAxes.${axis}`
    );
  }
  assert.equal(record.provenanceRecord.schema, "afi.provenance-record.v1");
  assert.ok(record.provenanceRecord.inputHash, "reactor-computed canonical input hash");
  ok("P2 evidence constructed by the reactor (UWR stamp + scores + axes + hashes the gateway never had)");

  // ---- P3: provenance is authenticated by the gateway, not fabricated ----
  assert.equal(
    record.scoredSignal.providerId,
    "gateway:tenant-a",
    "authenticated tenant provenance reached canonical evidence"
  );

  const spoofId = "gw-boundary-it-spoof";
  const spoof = await request(app)
    .post("/api/v1/signals")
    .set("x-api-key", apiKey)
    .send({ ...payload, signalId: spoofId, providerId: "spoofed-by-caller" });
  assert.equal(spoof.status, 200);
  const spoofRecord = await evidenceCollection(client).findOne({ signalId: spoofId });
  assert.equal(
    spoofRecord.scoredSignal.providerId,
    "gateway:tenant-a",
    "a caller cannot spoof provenance through the gateway"
  );
  ok("P3 provenance authenticated by the gateway; caller-supplied providerId overridden");

  // ---- P4: idempotency preserved ----
  const res2 = await request(app).post("/api/v1/signals").set("x-api-key", apiKey).send(payload);
  assert.equal(res2.status, 200, "identical resubmission is still a 200");
  assert.equal(res2.body.persistence.outcome, "idempotent-duplicate");
  assert.equal(
    await evidenceCollection(client).countDocuments({ signalId }),
    1,
    "no second record for an identical request"
  );
  ok("P4 repeating the same canonical request preserves idempotency (still one record)");

  // ---- P5: conflicting duplicate preserved ----
  const snapshot = await evidenceCollection(client).findOne({ signalId });
  const conflict = await request(app)
    .post("/api/v1/signals")
    .set("x-api-key", apiKey)
    .send({ ...payload, direction: "short" }); // same signalId, genuinely different content
  assert.equal(conflict.status, 409, `expected 409, got ${conflict.status}`);
  assert.equal(conflict.body.persisted, false);
  const afterConflict = await evidenceCollection(client).findOne({ signalId });
  assert.deepEqual(afterConflict, snapshot, "append-once: the stored record is untouched");
  assert.equal(await evidenceCollection(client).countDocuments({ signalId }), 1);
  ok("P5 conflicting duplicate preserves the 409 conflict behavior; stored record unchanged");

  // ---- P6: invalid raw input creates no canonical evidence ----
  const before = await evidenceCollection(client).countDocuments({});
  const invalid = await request(app)
    .post("/api/v1/signals")
    .set("x-api-key", apiKey)
    .send({ symbol: "BTCUSDT", nonsense: { arbitrary: "raw body" } });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error, "invalid_payload");
  assert.equal(
    await evidenceCollection(client).countDocuments({}),
    before,
    "invalid raw input created no canonical evidence"
  );
  ok("P6 invalid raw input creates no canonical evidence");

  // ---- P7: reactor unavailable -> honest failure, no evidence ----
  const { app: deadApp, apiKeyStore: deadStore } = buildApp({
    reactorSubmitter: (await import(
      pathToFileURL(path.resolve(process.cwd(), "dist/src/services/reactorSubmitter.js")).href
    )).createReactorSubmitter(`http://127.0.0.1:${DEAD_PORT}`, SHARED_SECRET),
  });
  const { apiKey: deadKey } = await deadStore.createKey("tenant-a", "dead-reactor");
  const unavailable = await request(deadApp)
    .post("/api/v1/signals")
    .set("x-api-key", deadKey)
    .send({ ...payload, signalId: "gw-boundary-it-unavailable" });
  assert.equal(unavailable.status, 503, `expected 503, got ${unavailable.status}`);
  assert.notEqual(unavailable.status, 200);
  assert.notEqual(unavailable.status, 202);
  assert.equal(unavailable.body.error, "reactor_unavailable");
  assert.equal(unavailable.body.persisted, false);
  assert.equal(
    await evidenceCollection(client).countDocuments({ signalId: "gw-boundary-it-unavailable" }),
    0,
    "an unreachable reactor persists nothing"
  );
  ok("P7 reactor unavailable -> honest 503, no canonical evidence, never a masked 200/202");

  // ---- P8: failed UWR resolution -> no evidence ----
  // A real reactor whose UWR source cannot resolve: it refuses to score rather
  // than scoring from a bad state, so no record may exist.
  const { log: badLog } = spawnReactor(BAD_UWR_PORT, {
    AFI_UWR_PROFILE_SOURCE: "not-a-recognized-source",
  });
  await waitForHealth(BAD_UWR_PORT, badLog);

  const { app: badApp, apiKeyStore: badStore } = buildApp({
    reactorSubmitter: (await import(
      pathToFileURL(path.resolve(process.cwd(), "dist/src/services/reactorSubmitter.js")).href
    )).createReactorSubmitter(`http://127.0.0.1:${BAD_UWR_PORT}`, SHARED_SECRET),
  });
  const { apiKey: badKey } = await badStore.createKey("tenant-a", "bad-uwr");
  const uwrSignalId = "gw-boundary-it-uwr-fail";
  const uwrFail = await request(badApp)
    .post("/api/v1/signals")
    .set("x-api-key", badKey)
    .send({ ...payload, signalId: uwrSignalId });

  assert.notEqual(uwrFail.status, 200, "a failed UWR resolution must never report success");
  assert.notEqual(uwrFail.status, 202);
  assert.equal(uwrFail.body.persisted, false);
  assert.equal(
    await evidenceCollection(client).countDocuments({ signalId: uwrSignalId }),
    0,
    "failed UWR resolution persists nothing"
  );
  ok(`P8 failed UWR resolution -> no canonical evidence (gateway ${uwrFail.status}, persisted:false)`);

  // ---- P9: no gateway scored-signal collection anywhere on the server ----
  const { databases } = await client.db().admin().listDatabases();
  const dbNames = databases.map((d) => d.name);
  assert.ok(!dbNames.includes("afi_tssd"), "the legacy gateway TSSD database was never created");

  for (const name of dbNames) {
    if (["admin", "local", "config"].includes(name)) continue;
    const cols = (await client.db(name).listCollections().toArray()).map((c) => c.name);
    for (const banned of ["tssd_signals", "reactor_scored_signals_v1"]) {
      assert.ok(!cols.includes(banned), `${name}.${banned} must never be created by the gateway`);
    }
  }

  const evidenceCols = (await client.db(EVIDENCE_DB).listCollections().toArray()).map((c) => c.name);
  assert.ok(
    evidenceCols.every((c) => c.startsWith(EVIDENCE_COLLECTION)),
    `only canonical evidence collections exist in ${EVIDENCE_DB}: ${evidenceCols.join(", ")}`
  );
  ok("P9 no old or alternate gateway scored-signal collection was created");

  // ---- P10: the gateway's operational plane holds no scored-signal data ----
  const opCols = (await client.db(OPERATIONAL_DB).listCollections().toArray()).map((c) => c.name);
  assert.deepEqual(opCols.sort(), ["api_keys"], `operational plane holds only api_keys`);
  ok("P10 gateway operational plane is cleanly separated from canonical evidence");

  await client.close();
  console.log(`\n✅ Gateway boundary proof passed (${passed} assertions).`);
}

function cleanup() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGKILL");
  }
}

// Bounded emergency stop: a hang must fail the build, never sit until the
// runner's own timeout with an ambiguous result.
const emergency = setTimeout(() => {
  console.error("FATAL: gateway boundary proof exceeded its time budget.");
  cleanup();
  process.exit(1);
}, 10 * 60 * 1000);
emergency.unref();

try {
  await main();
  cleanup();
  process.exit(0);
} catch (err) {
  console.error("\n❌ Gateway boundary proof FAILED:\n", err);
  cleanup();
  process.exit(1);
}
