/**
 * MongoDB Connection Helper for AFI Eliza Gateway
 *
 * SCOPE:
 * This helper is for gateway-specific data ONLY:
 *   - Chat/session history for custom characters
 *   - Demo/dev-only documents (e.g., healthcheck collection)
 *   - Future gateway-specific metadata
 *
 * IMPORTANT:
 * This is NOT for TSSD vault data. The canonical TSSD vault lives in
 * other AFI repos (afi-reactor, afi-infra) and uses separate database
 * and collection names.
 *
 * Database: afi_eliza (default, can be overridden via AFI_MONGO_DB_NAME)
 * Collections: sessions, messages, demo_health, etc.
 */

import { MongoClient, Db } from "mongodb";

/**
 * Singleton MongoDB client instance
 * Reused across all calls to avoid connection storms
 */
let cachedClient: MongoClient | null = null;

/**
 * Get the singleton MongoDB client
 *
 * Reads MONGODB_URI from process.env and creates/reuses a single client.
 * Throws an error if MONGODB_URI is not set.
 *
 * @returns Promise<MongoClient> - The MongoDB client instance
 * @throws Error if MONGODB_URI is not set
 */
export async function getMongoClient(): Promise<MongoClient> {
  // If we already have a connected client, reuse it
  if (cachedClient) {
    return cachedClient;
  }

  // Read MongoDB URI from environment
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const errorMsg =
      "[AFI Mongo] MONGODB_URI is not set. Cannot connect to MongoDB.\n" +
      "Please set MONGODB_URI in your .env file or environment variables.\n" +
      "See .env.example for the expected format.";
    console.error(errorMsg);
    throw new Error("MONGODB_URI environment variable is required");
  }

  try {
    console.log("[AFI Mongo] Connecting to MongoDB...");

    // Create new MongoClient
    const client = new MongoClient(uri, {
      // Connection options for production use
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Connect to MongoDB
    await client.connect();

    // Verify connection with a ping
    await client.db("admin").command({ ping: 1 });

    console.log("[AFI Mongo] Successfully connected to MongoDB");

    // Cache the client for reuse
    cachedClient = client;

    return client;
  } catch (error) {
    console.error("[AFI Mongo] Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Get a database instance
 *
 * Uses the singleton client and returns a Db instance for the specified
 * database name. If no name is provided, uses AFI_MONGO_DB_NAME from env
 * or defaults to "afi_eliza".
 *
 * @param dbName - Optional database name (defaults to env or "afi_eliza")
 * @returns Promise<Db> - The database instance
 */
export async function getDb(dbName?: string): Promise<Db> {
  const client = await getMongoClient();

  // Determine database name
  const finalDbName =
    dbName || process.env.AFI_MONGO_DB_NAME || "afi_eliza";

  console.log(`[AFI Mongo] Using database: ${finalDbName}`);

  return client.db(finalDbName);
}

/**
 * Close the MongoDB connection
 *
 * Closes the cached client and clears the cache.
 * Safe to call multiple times (no-op if not connected).
 * Use this for graceful shutdown.
 *
 * @returns Promise<void>
 */
export async function closeMongoConnection(): Promise<void> {
  if (cachedClient) {
    console.log("[AFI Mongo] Closing MongoDB connection...");
    await cachedClient.close();
    cachedClient = null;
    console.log("[AFI Mongo] MongoDB connection closed");
  }
}

/**
 * Check if MongoDB is connected
 *
 * @returns boolean - True if client is cached and connected
 */
export function isMongoConnected(): boolean {
  return cachedClient !== null;
}

