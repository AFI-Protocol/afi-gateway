/**
 * GUARDRAIL — the Gateway serves no standalone skills catalog.
 *
 * The Gateway authenticates and routes; it does not own or serve a manually
 * curated agent skills catalog. The removed `afi-skills` repository was read by
 * a filesystem manifest reader and exposed through `/api/v1/skills*` routes;
 * this guard makes those reintroduction paths structurally impossible:
 *
 *   - a filesystem reader of the removed repo's manifest (`../afi-skills`),
 *   - an environment variable locating that repo/manifest,
 *   - a skills-manifest service module or its route surface,
 *   - a CI step that checks out the removed sibling repository.
 *
 * The token list below exists solely for enforcement; it is not documentation.
 *
 * Scope: package manifests, lockfile, source (src/plugins/scripts), and the
 * workflow files under .github/workflows.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..");

/** The removed repository, by name and as a sibling path. */
const FORBIDDEN_REPO = "afi-skills";
const FORBIDDEN_SIBLING = "../afi-skills";

/** Removed environment variables that located the manifest / plugin map. */
const FORBIDDEN_ENV = ["AFI_SKILLS_MANIFEST_PATH", "AFI_SKILL_PLUGIN_MAP"];

/** Removed source surfaces. */
const FORBIDDEN_TOKENS = ["skillsService", "/api/v1/skills"];

const SCANNED_DIRS = ["src", "plugins", "scripts"];

function collect(dir: string, exts: string[]): string[] {
  const abs = join(REPO_ROOT, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (exts.some((e) => entry.endsWith(e))) out.push(full);
    }
  };
  walk(abs);
  return out;
}

const rel = (f: string) => f.slice(REPO_ROOT.length + 1);
const SOURCE_FILES = SCANNED_DIRS.flatMap((d) => collect(d, [".ts", ".mts"]));
const WORKFLOW_FILES = collect(".github/workflows", [".yml", ".yaml"]);

describe("GUARDRAIL: gateway serves no standalone skills catalog", () => {
  it("scans a non-empty set of source files", () => {
    expect(SOURCE_FILES.length).toBeGreaterThan(5);
  });

  it("no source file reintroduces the removed skills surface", () => {
    const banned = [FORBIDDEN_REPO, FORBIDDEN_SIBLING, ...FORBIDDEN_ENV, ...FORBIDDEN_TOKENS];
    const offenders: string[] = [];
    for (const file of SOURCE_FILES) {
      const content = readFileSync(file, "utf8");
      if (banned.some((t) => content.includes(t))) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it("declares no skills-repo dependency and keeps the lockfile free of its sibling path", () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
    const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}), ...(pkg.optionalDependencies ?? {}) };
    expect(Object.keys(all).some((d) => d.includes(FORBIDDEN_REPO))).toBe(false);
    const lockPath = join(REPO_ROOT, "package-lock.json");
    if (existsSync(lockPath)) {
      expect(readFileSync(lockPath, "utf8").includes(FORBIDDEN_SIBLING)).toBe(false);
    }
  });

  it("checks out no external skills sibling repository in CI", () => {
    const offenders: string[] = [];
    for (const file of WORKFLOW_FILES) {
      const content = readFileSync(file, "utf8");
      if (content.includes(FORBIDDEN_SIBLING) || /repository:\s*\S*afi-skills/.test(content)) {
        offenders.push(rel(file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
