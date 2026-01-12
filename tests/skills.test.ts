import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, rmSync } from "fs";
import path from "path";
import os from "os";
import { listSkills, getSkillById, summarizeCapabilities } from "../src/services/skillsService.js";

const tmpManifestPath = path.join(os.tmpdir(), "afi-skills-manifest-test.json");

beforeAll(() => {
  const manifest = {
    version: "0.1.0",
    skills: [
      { id: "alpha", name: "Alpha Skill", domain: "test", tags: ["foo"], description: "Alpha" },
      { id: "beta", name: "Beta Skill", domain: "demo", tags: ["bar"] },
    ],
  };
  writeFileSync(tmpManifestPath, JSON.stringify(manifest), "utf8");
  process.env.AFI_SKILLS_MANIFEST_PATH = tmpManifestPath;
});

afterAll(() => {
  try {
    rmSync(tmpManifestPath, { force: true });
  } catch {
    /* ignore */
  }
});

describe("skills service", () => {
  it("lists skills", async () => {
    const skills = await listSkills({}, tmpManifestPath);
    expect(skills).toHaveLength(2);
  });

  it("filters by query", async () => {
    const skills = await listSkills({ q: "beta" }, tmpManifestPath);
    expect(skills).toHaveLength(1);
    expect(skills[0].id).toBe("beta");
  });

  it("returns detail", async () => {
    const skill = await getSkillById("alpha", tmpManifestPath);
    expect(skill?.id).toBe("alpha");
  });

  it("summarizes capabilities", async () => {
    const summary = await summarizeCapabilities(tmpManifestPath);
    expect(summary.totalSkills).toBe(2);
    expect(summary.domains.test).toBe(1);
  });
});
