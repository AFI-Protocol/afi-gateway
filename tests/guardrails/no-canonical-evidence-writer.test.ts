/**
 * GUARDRAIL — the Gateway is a submission boundary, never a canonical writer.
 *
 * Enforces AFI-GOV-PERSISTENCE-IMPL-v0.1 Slot 4 (MONGO-GATEWAY-BOUNDARY) and
 * MONGO-GOV D-MONGO-3/D-MONGO-4/D-MONGO-7 as executable assertions rather than
 * review discipline:
 *
 *   - no canonical evidence store instantiation or import (afi-infra),
 *   - no canonical evidence construction or UWR stamping,
 *   - no write to `scored_signal_evidence` or to any substitute/legacy
 *     scored-signal collection (`tssd_signals`, `reactor_scored_signals_v1`),
 *   - exactly one MongoDB entrypoint, serving the operational plane only.
 *
 * Modelled on afi-reactor/test/guardrails/no-legacy-reactor-vault.test.ts.
 *
 * Scope: src/, plugins/, scripts/ — the Gateway's shipped runtime surface.
 * tests/ and test/ are excluded: the proofs must be able to NAME the canonical
 * collection in order to assert the Gateway never wrote to it.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..");
const SCANNED_DIRS = ["src", "plugins", "scripts"];

/** The sole file permitted to construct a MongoDB connection. */
const MONGO_ENTRYPOINT = "src/lib/db/mongo.ts";

/**
 * The only files permitted to reference the mongodb driver at all — the
 * operational plane (connection helper + the API key store's types). Any new
 * name here means a new Mongo surface in the Gateway and must be reviewed.
 */
const MONGO_DRIVER_FILES = ["src/lib/db/mongo.ts", "src/services/apiKeyStore.ts"];

/** Gateway-owned operational collections. Canonical evidence is not here. */
const ALLOWED_COLLECTIONS = ["api_keys", "demo_health"];

/** The only database the Gateway may name: its operational plane. */
const ALLOWED_DB_NAME = "afi_eliza";

const BANNED_TOKENS = [
  // --- Canonical evidence store: Reactor submits, afi-infra writes ---
  "MongoScoredSignalEvidenceStore",
  "IScoredSignalEvidenceStore",
  "ScoredSignalEvidenceRecord",
  "afi.scored-signal-evidence.v1",
  "afi.scored-signal-evidence.v2",
  "afi.scored-signal-evidence.v3",
  "afi.provider-invocation-proof.v1",
  "afi.aiml-invocation-proof.v1",
  "providerInvocations",
  "scored_signal_evidence",
  "scored_signal_evidence_history",
  "afi_scored_signal_evidence",
  "AFI_EVIDENCE_MONGODB_URI",
  "AFI_EVIDENCE_DB_NAME",
  "AFI_EVIDENCE_COLLECTION",
  "AFI_EVIDENCE_HISTORY_COLLECTION",
  // --- Evidence construction + UWR stamping: Reactor-owned ---
  "buildReactorEvidenceRecord",
  "uwrProfile",
  "uwrProfileStampFor",
  "builtin-value-identity",
  "registry-consumed",
  "afi.provenance-record.v1",
  // --- Legacy / substitute scored-signal stores (D-MONGO-7, demoted) ---
  "tssd_signals",
  "afi_tssd",
  "reactor_scored_signals_v1",
  "AFI_TSSD_MONGODB_URI",
  "AFI_TSSD_DB_NAME",
  "AFI_TSSD_COLLECTION",
  "TenantScopedTSSDVaultClient",
  "MongoTSSDVaultClient",
  "InMemoryTSSDVaultClient",
  "ITSSDVaultClient",
  "VaultedSignalRecord",
  "vaultFactory",
  "VaultFactory",
];

/** Modules deleted by Slot 4 that must never return. */
const DELETED_PATHS = ["src/services/vaultFactory.ts"];

function tsFiles(dir: string): string[] {
  const abs = join(REPO_ROOT, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".ts") || entry.endsWith(".mts")) out.push(full);
    }
  };
  walk(abs);
  return out;
}

const ALL_FILES = SCANNED_DIRS.flatMap(tsFiles);
const rel = (f: string) => f.slice(REPO_ROOT.length + 1);

describe("GUARDRAIL: gateway never writes canonical scored evidence", () => {
  it("scans a non-empty set of source files", () => {
    // Guards the guard: a broken walker would make every assertion below pass.
    expect(ALL_FILES.length).toBeGreaterThan(5);
  });

  it("contains no canonical-evidence or legacy-vault token", () => {
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const content = readFileSync(file, "utf8");
      for (const token of BANNED_TOKENS) {
        if (content.includes(token)) offenders.push(`${rel(file)} :: ${token}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("does not depend on or import afi-infra", () => {
    // afi-infra owns the sole canonical write boundary. Not depending on it
    // makes instantiating the canonical store structurally impossible.
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain("afi-infra");
    expect(Object.keys(pkg.devDependencies ?? {})).not.toContain("afi-infra");

    // Import specifiers only — prose mentioning afi-infra in a comment is fine.
    const importRe = /(?:from\s*|require\(\s*)["']afi-infra(?:\/[^"']*)?["']/;
    const offenders = ALL_FILES.filter((f) => importRe.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("does not reintroduce the deleted legacy vault module", () => {
    expect(DELETED_PATHS.filter((p) => existsSync(join(REPO_ROOT, p)))).toEqual([]);
  });

  it("confines the mongodb driver to the operational plane", () => {
    const driverRe = /(?:from\s*|require\(\s*)["']mongodb["']/;
    const importers = ALL_FILES.filter((f) => driverRe.test(readFileSync(f, "utf8"))).map(rel);
    expect(importers.sort()).toEqual([...MONGO_DRIVER_FILES].sort());
  });

  it("constructs a MongoDB connection in exactly one place", () => {
    // A second connection surface is how a canonical writer would creep back in.
    const connectors = ALL_FILES.filter((f) =>
      /new\s+MongoClient\s*\(/.test(readFileSync(f, "utf8"))
    ).map(rel);
    expect(connectors).toEqual([MONGO_ENTRYPOINT]);
  });

  it("names only gateway-operational collections and databases", () => {
    const collectionRe = /\.collection(?:<[^>]*>)?\(\s*["']([^"']+)["']/g;
    const dbRe = /\bdb\(\s*["']([^"']+)["']\s*\)/g;
    const offenders: string[] = [];

    for (const file of ALL_FILES) {
      const content = readFileSync(file, "utf8");
      for (const m of content.matchAll(collectionRe)) {
        if (!ALLOWED_COLLECTIONS.includes(m[1])) offenders.push(`${rel(file)} :: collection("${m[1]}")`);
      }
      for (const m of content.matchAll(dbRe)) {
        // "admin" is the ping target of the operational connection check.
        if (m[1] !== ALLOWED_DB_NAME && m[1] !== "admin") {
          offenders.push(`${rel(file)} :: db("${m[1]}")`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
