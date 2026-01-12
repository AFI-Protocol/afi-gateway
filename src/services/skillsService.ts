import { promises as fs } from "fs";
import path from "path";

export interface SkillRecord {
  id: string;
  name: string;
  version?: string;
  domain?: string;
  description?: string;
  risk_level?: string;
  determinism_required?: boolean;
  allowed_tools?: string[];
  owners?: string[];
  last_updated?: string;
  tags?: string[];
  file_path?: string;
  pluginId?: string;
}

export interface SkillsManifest {
  version: string;
  generated_at?: string;
  skill_count?: number;
  skills: SkillRecord[];
}

export interface SkillSearchQuery {
  q?: string;
  domain?: string;
  tag?: string;
}

export interface CapabilitySummary {
  totalSkills: number;
  domains: Record<string, number>;
  tags: Record<string, number>;
}

const defaultManifestPath = path.resolve(process.cwd(), "../afi-skills/manifest.json");

let cachedManifest: SkillsManifest | null = null;
let cachedPath: string | null = null;

function loadPluginMap(): Record<string, string> {
  const raw = process.env.AFI_SKILL_PLUGIN_MAP;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[skillsService] Failed to parse AFI_SKILL_PLUGIN_MAP, ignoring", err);
    return {};
  }
}

export async function loadSkillsManifest(manifestPath?: string): Promise<SkillsManifest> {
  const resolved = manifestPath ? path.resolve(manifestPath) : defaultManifestPath;

  if (cachedManifest && cachedPath === resolved) {
    return cachedManifest;
  }

  const data = await fs.readFile(resolved, "utf8");
  const parsed: SkillsManifest = JSON.parse(data);

  const pluginMap = loadPluginMap();
  parsed.skills = (parsed.skills || []).map((s) => ({
    ...s,
    pluginId: pluginMap[s.id],
  }));

  cachedManifest = parsed;
  cachedPath = resolved;
  return parsed;
}

export async function listSkills(query: SkillSearchQuery = {}, manifestPath?: string): Promise<SkillRecord[]> {
  const manifest = await loadSkillsManifest(manifestPath);
  const q = query.q?.toLowerCase();
  const tag = query.tag?.toLowerCase();
  const domain = query.domain?.toLowerCase();

  return (manifest.skills || []).filter((skill) => {
    if (domain && skill.domain?.toLowerCase() !== domain) return false;
    if (tag && !skill.tags?.some((t) => t.toLowerCase() === tag)) return false;
    if (q) {
      const haystack = [skill.id, skill.name, skill.description, ...(skill.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function getSkillById(id: string, manifestPath?: string): Promise<SkillRecord | undefined> {
  const manifest = await loadSkillsManifest(manifestPath);
  return manifest.skills.find((s) => s.id === id);
}

export async function summarizeCapabilities(manifestPath?: string): Promise<CapabilitySummary> {
  const manifest = await loadSkillsManifest(manifestPath);
  const domains: Record<string, number> = {};
  const tags: Record<string, number> = {};

  for (const skill of manifest.skills) {
    if (skill.domain) {
      domains[skill.domain] = (domains[skill.domain] || 0) + 1;
    }
    for (const t of skill.tags || []) {
      tags[t] = (tags[t] || 0) + 1;
    }
  }

  return {
    totalSkills: manifest.skills.length,
    domains,
    tags,
  };
}
