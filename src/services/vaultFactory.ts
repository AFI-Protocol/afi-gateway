import { TenantScopedTSSDVaultClient } from "afi-infra/src/tssd/index.js";
import { InMemoryTSSDVaultClient, type ITSSDVaultClient } from "afi-infra/src/tssd/TSSDVaultClient.js";
import type { MongoTSSDVaultClientConfig } from "afi-infra/src/tssd/MongoTSSDVaultClient.js";

export type VaultFactory = (tenantId: string) => ITSSDVaultClient;

function baseMongoConfig(): MongoTSSDVaultClientConfig {
  const mongoUri =
    process.env.AFI_TSSD_MONGODB_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("AFI_TSSD_MONGODB_URI (or MONGODB_URI) is required for tenant-scoped vault access");
  }

  return {
    mongoUri,
    dbName: process.env.AFI_TSSD_DB_NAME || "afi_tssd",
    collectionName: process.env.AFI_TSSD_COLLECTION || "tssd_signals",
  };
}

export function createVaultFactoryFromEnv(): VaultFactory {
  const config = baseMongoConfig();
  const cache = new Map<string, ITSSDVaultClient>();
  return (tenantId: string) => {
    if (cache.has(tenantId)) return cache.get(tenantId)!;
    const client = new TenantScopedTSSDVaultClient({ tenantId, ...config });
    cache.set(tenantId, client);
    return client;
  };
}

export function createInMemoryVaultFactory(): VaultFactory {
  const cache = new Map<string, ITSSDVaultClient>();
  return (tenantId: string) => {
    if (cache.has(tenantId)) return cache.get(tenantId)!;
    const client = new TenantScopedTSSDVaultClient({
      tenantId,
      innerClient: new InMemoryTSSDVaultClient(),
    });
    cache.set(tenantId, client);
    return client;
  };
}
