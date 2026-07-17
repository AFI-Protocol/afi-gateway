/**
 * GUARDRAIL — the Gateway carries no shared CLI-framework dependency.
 *
 * The Gateway's operational surface is its servers (`start`, `start:minimal`)
 * and its ElizaOS runtime; it depends only on public, first-party packages.
 * This guard makes three reintroduction paths structurally impossible:
 *
 *   - a package dependency on the framework package,
 *   - a source/config import of the framework package or its sibling path,
 *   - a CI step that checks out an external CLI-framework sibling repository.
 *
 * The token list below exists solely for enforcement; it is not documentation.
 *
 * Scope: package manifests, lockfile, tsconfig, source (src/plugins/scripts),
 * and the workflow files under .github/workflows.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..");

/** The forbidden package specifier — a dependency edge onto the framework. */
const FORBIDDEN_PACKAGE = "@afi/cli-framework";

/** The forbidden sibling path — a `file:` / relative import of a checked-out clone. */
const FORBIDDEN_SIBLING = "../afi-cli-framework";

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

describe("GUARDRAIL: gateway carries no shared CLI-framework dependency", () => {
  it("scans a non-empty set of source and workflow files", () => {
    // Guards the guard: a broken walker would make every assertion below pass.
    expect(SOURCE_FILES.length).toBeGreaterThan(5);
    expect(WORKFLOW_FILES.length).toBeGreaterThan(0);
  });

  it("declares no dependency on the framework package", () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
    const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}), ...(pkg.optionalDependencies ?? {}) };
    expect(Object.keys(all)).not.toContain(FORBIDDEN_PACKAGE);
  });

  it("keeps the lockfile free of the framework package and its sibling path", () => {
    const lockPath = join(REPO_ROOT, "package-lock.json");
    if (!existsSync(lockPath)) return;
    const lock = readFileSync(lockPath, "utf8");
    expect(lock.includes(FORBIDDEN_PACKAGE)).toBe(false);
    expect(lock.includes(FORBIDDEN_SIBLING)).toBe(false);
  });

  it("imports the framework package or its sibling path from no source or config file", () => {
    const configs = ["tsconfig.json"].map((f) => join(REPO_ROOT, f)).filter(existsSync);
    const offenders: string[] = [];
    for (const file of [...SOURCE_FILES, ...configs]) {
      const content = readFileSync(file, "utf8");
      if (content.includes(FORBIDDEN_PACKAGE) || content.includes(FORBIDDEN_SIBLING)) {
        offenders.push(rel(file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("checks out no external CLI-framework sibling repository in CI", () => {
    const offenders: string[] = [];
    for (const file of WORKFLOW_FILES) {
      const content = readFileSync(file, "utf8");
      // Any workflow reference to the removed repo, by package spec, sibling
      // path, or `repository:` checkout target.
      if (
        content.includes(FORBIDDEN_PACKAGE) ||
        content.includes(FORBIDDEN_SIBLING) ||
        /repository:\s*\S*afi-cli-framework/.test(content)
      ) {
        offenders.push(rel(file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
