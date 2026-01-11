import { randomBytes, createHash } from "crypto";
import { ObjectId, type Collection } from "mongodb";
import { getDb } from "../lib/db/mongo.js";

export type ApiKeyStatus = "active" | "revoked";

export interface RateLimitRule {
  limit: number; // requests per window
  windowSeconds: number;
}

export interface ApiKeyRecord {
  _id?: ObjectId;
  keyId: string;
  keyHash: string;
  keySuffix: string;
  tenantId: string;
  label?: string;
  status: ApiKeyStatus;
  createdAt: Date;
  revokedAt?: Date | null;
  lastUsedAt?: Date | null;
  rateLimit?: RateLimitRule;
}

export interface ApiKeyMetadata {
  keyId: string;
  keySuffix: string;
  tenantId: string;
  label?: string;
  status: ApiKeyStatus;
  createdAt: string;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
  rateLimit?: RateLimitRule;
}

export interface CreatedApiKey {
  apiKey: string;
  metadata: ApiKeyMetadata;
}

export interface ApiKeyStore {
  ensureIndexes(): Promise<void>;
  createKey(tenantId: string, label?: string, rateLimit?: RateLimitRule): Promise<CreatedApiKey>;
  listKeys(tenantId: string): Promise<ApiKeyMetadata[]>;
  revokeKey(tenantId: string, keyId: string): Promise<boolean>;
  findByApiKey(apiKey: string): Promise<ApiKeyRecord | null>;
  markUsed(keyId: string): Promise<void>;
}

function hashApiKey(apiKey: string): string {
  const salt = process.env.API_KEY_SALT || "";
  return createHash("sha256").update(apiKey + salt).digest("hex");
}

function normalizeMetadata(record: ApiKeyRecord): ApiKeyMetadata {
  return {
    keyId: record.keyId,
    keySuffix: record.keySuffix,
    tenantId: record.tenantId,
    label: record.label,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    revokedAt: record.revokedAt ? record.revokedAt.toISOString() : null,
    lastUsedAt: record.lastUsedAt ? record.lastUsedAt.toISOString() : null,
    rateLimit: record.rateLimit,
  };
}

function generateKeyId(): string {
  return `ak_${randomBytes(12).toString("base64url")}`;
}

function generateApiKey(): { apiKey: string; keyHash: string; keySuffix: string } {
  const apiKey = `afi_${randomBytes(24).toString("base64url")}`;
  const keyHash = hashApiKey(apiKey);
  const keySuffix = apiKey.slice(-6);
  return { apiKey, keyHash, keySuffix };
}

export class MongoApiKeyStore implements ApiKeyStore {
  private initialized = false;

  private async collection(): Promise<Collection<ApiKeyRecord>> {
    const db = await getDb(process.env.AFI_MONGO_DB_NAME || "afi_eliza");
    return db.collection<ApiKeyRecord>("api_keys");
  }

  async ensureIndexes(): Promise<void> {
    if (this.initialized) return;
    const col = await this.collection();
    await col.createIndex({ keyHash: 1 }, { unique: true, name: "keyHash_unique" });
    await col.createIndex({ tenantId: 1 }, { name: "tenantId_idx" });
    await col.createIndex({ status: 1 }, { name: "status_idx" });
    this.initialized = true;
  }

  async createKey(tenantId: string, label?: string, rateLimit?: RateLimitRule): Promise<CreatedApiKey> {
    if (!tenantId) {
      throw new Error("tenantId is required to create an API key");
    }
    await this.ensureIndexes();
    const col = await this.collection();
    const { apiKey, keyHash, keySuffix } = generateApiKey();
    const record: ApiKeyRecord = {
      keyId: generateKeyId(),
      keyHash,
      keySuffix,
      tenantId,
      label,
      status: "active",
      createdAt: new Date(),
      revokedAt: null,
      lastUsedAt: null,
      rateLimit,
    };
    await col.insertOne(record);
    return { apiKey, metadata: normalizeMetadata(record) };
  }

  async listKeys(tenantId: string): Promise<ApiKeyMetadata[]> {
    await this.ensureIndexes();
    const col = await this.collection();
    const docs = await col.find({ tenantId }).sort({ createdAt: -1 }).toArray();
    return docs.map(normalizeMetadata);
  }

  async revokeKey(tenantId: string, keyId: string): Promise<boolean> {
    await this.ensureIndexes();
    const col = await this.collection();
    const result = await col.updateOne(
      { tenantId, keyId },
      { $set: { status: "revoked", revokedAt: new Date() } }
    );
    return result.matchedCount > 0;
  }

  async findByApiKey(apiKey: string): Promise<ApiKeyRecord | null> {
    await this.ensureIndexes();
    const col = await this.collection();
    const keyHash = hashApiKey(apiKey);
    const doc = await col.findOne({ keyHash, status: "active" });
    return doc ?? null;
  }

  async markUsed(keyId: string): Promise<void> {
    await this.ensureIndexes();
    const col = await this.collection();
    await col.updateOne({ keyId }, { $set: { lastUsedAt: new Date() } });
  }
}

export class InMemoryApiKeyStore implements ApiKeyStore {
  private records = new Map<string, ApiKeyRecord>();
  private initialized = true;

  async ensureIndexes(): Promise<void> {
    return;
  }

  async createKey(tenantId: string, label?: string, rateLimit?: RateLimitRule): Promise<CreatedApiKey> {
    const { apiKey, keyHash, keySuffix } = generateApiKey();
    const record: ApiKeyRecord = {
      keyId: generateKeyId(),
      keyHash,
      keySuffix,
      tenantId,
      label,
      status: "active",
      createdAt: new Date(),
      revokedAt: null,
      lastUsedAt: null,
      rateLimit,
    };
    this.records.set(record.keyId, record);
    return { apiKey, metadata: normalizeMetadata(record) };
  }

  async listKeys(tenantId: string): Promise<ApiKeyMetadata[]> {
    return Array.from(this.records.values())
      .filter((r) => r.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(normalizeMetadata);
  }

  async revokeKey(tenantId: string, keyId: string): Promise<boolean> {
    const record = this.records.get(keyId);
    if (!record || record.tenantId !== tenantId) return false;
    record.status = "revoked";
    record.revokedAt = new Date();
    this.records.set(keyId, record);
    return true;
  }

  async findByApiKey(apiKey: string): Promise<ApiKeyRecord | null> {
    const keyHash = hashApiKey(apiKey);
    for (const record of this.records.values()) {
      if (record.keyHash === keyHash && record.status === "active") {
        return record;
      }
    }
    return null;
  }

  async markUsed(keyId: string): Promise<void> {
    const record = this.records.get(keyId);
    if (record) {
      record.lastUsedAt = new Date();
      this.records.set(keyId, record);
    }
  }
}

export function getDefaultRateLimit(): RateLimitRule {
  const limit = Number(process.env.API_KEY_RATE_LIMIT ?? "120");
  const windowSeconds = Number(process.env.API_KEY_RATE_WINDOW ?? "60");
  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 120,
    windowSeconds: Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : 60,
  };
}

export function hashForTesting(apiKey: string): string {
  return hashApiKey(apiKey);
}
