/**
 * MongoDB Smoke Test for AFI Eliza Gateway
 *
 * This script verifies that:
 * 1. The MongoDB connection helper works
 * 2. We can connect to the MongoDB Atlas cluster
 * 3. We can insert and read a simple document
 *
 * Usage:
 *   1. Copy .env.example to .env
 *   2. Set MONGODB_URI to your real Atlas connection string
 *   3. Run: npm run test:mongo
 *
 * Expected behavior:
 *   - Connects to MongoDB using MONGODB_URI from .env
 *   - Uses database: afi_eliza (or AFI_MONGO_DB_NAME override)
 *   - Uses collection: demo_health
 *   - Inserts a test document
 *   - Reads it back and displays the result
 *   - Exits with code 0 on success, non-zero on failure
 */

// Load environment variables from .env file
import "dotenv/config";

import { getDb, closeMongoConnection } from "../src/lib/db/mongo.js";

interface HealthDoc {
  _id?: any;
  createdAt: Date;
  note: string;
  version?: string;
}

async function runSmokeTest(): Promise<void> {
  console.log("\n🔍 AFI Eliza Gateway — MongoDB Smoke Test\n");
  console.log("=" .repeat(60));

  try {
    // Step 1: Get database instance
    console.log("\n[1/4] Connecting to MongoDB...");
    const db = await getDb();
    const dbName = db.databaseName;
    console.log(`✅ Connected to database: ${dbName}`);

    // Step 2: Get collection
    console.log("\n[2/4] Accessing collection: demo_health");
    const collection = db.collection<HealthDoc>("demo_health");
    console.log("✅ Collection ready");

    // Step 3: Insert test document
    console.log("\n[3/4] Inserting test document...");
    const testDoc: HealthDoc = {
      createdAt: new Date(),
      note: "AFI Eliza gateway Mongo smoke test",
      version: process.env.npm_package_version || "unknown",
    };

    const insertResult = await collection.insertOne(testDoc);
    console.log(`✅ Document inserted with _id: ${insertResult.insertedId}`);

    // Step 4: Read document back
    console.log("\n[4/4] Reading document back...");
    const foundDoc = await collection.findOne(
      { _id: insertResult.insertedId },
      { sort: { createdAt: -1 } }
    );

    if (!foundDoc) {
      throw new Error("Failed to read back the inserted document");
    }

    console.log("✅ Document retrieved successfully");

    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("📊 SMOKE TEST RESULTS:");
    console.log("=".repeat(60));
    console.log(`Database:     ${dbName}`);
    console.log(`Collection:   demo_health`);
    console.log(`Document ID:  ${foundDoc._id}`);
    console.log(`Created At:   ${foundDoc.createdAt.toISOString()}`);
    console.log(`Note:         ${foundDoc.note}`);
    console.log(`Version:      ${foundDoc.version || "N/A"}`);
    console.log("=".repeat(60));

    // Count total documents in collection
    const totalDocs = await collection.countDocuments();
    console.log(`\n📈 Total documents in demo_health: ${totalDocs}`);

    // Success!
    console.log("\n✅ SMOKE TEST PASSED\n");
    console.log("MongoDB connection is working correctly.");
    console.log("You can now use MongoDB in your AFI Eliza Gateway.\n");

    // Clean up
    await closeMongoConnection();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ SMOKE TEST FAILED\n");

    if (error instanceof Error) {
      console.error("Error:", error.message);

      // Provide helpful hints for common errors
      if (error.message.includes("MONGODB_URI")) {
        console.error("\n💡 Hint: Make sure you have:");
        console.error("   1. Copied .env.example to .env");
        console.error("   2. Set MONGODB_URI to your MongoDB Atlas connection string");
        console.error("   3. Replaced <username>, <password>, and <cluster> with real values");
      } else if (error.message.includes("authentication")) {
        console.error("\n💡 Hint: Check your MongoDB Atlas credentials");
        console.error("   - Username and password in MONGODB_URI");
        console.error("   - Database user permissions in Atlas");
      } else if (error.message.includes("network") || error.message.includes("timeout")) {
        console.error("\n💡 Hint: Check your network connection");
        console.error("   - Are you connected to the internet?");
        console.error("   - Is your IP whitelisted in MongoDB Atlas?");
      }
    } else {
      console.error("Unknown error:", error);
    }

    console.error("\n");

    // Clean up and exit with error code
    await closeMongoConnection();
    process.exit(1);
  }
}

// Run the smoke test
runSmokeTest();

