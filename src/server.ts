/**
 * AFI Gateway Server
 * 
 * Main server implementation for the AFI Gateway system.
 * Handles HTTP API exposure for AFI Gateway.
 */

/**
 * AFI Gateway — HTTP Server Entrypoint
 *
 * This is the production HTTP server for AFI Gateway integration.
 *
 * Purpose:
 * - Expose AFI Gateway as a long-running HTTP service
 * - Provide health check endpoints
 * - Designed for Railway deployment (PORT-based, 0.0.0.0 binding)
 *
 * Architecture:
 * - This server is a STATELESS HTTP API wrapper around AFI Gateway
 * - It does NOT replace the CLI interface (see src/index.ts for CLI)
 * - It provides REST endpoints for health checks
 *
 * CUSTOM CHARACTER INTEGRATION:
 * This gateway is now a framework for building custom characters with skills.
 * To integrate custom characters:
 *
 * 1. Create character files in src/characters/your-character.ts
 * 2. Use server-full.ts for full ElizaOS API with character support
 * 3. See docs/CHARACTER_DEVELOPMENT.md for detailed guides
 *
 * Environment Variables:
 * - PORT: HTTP server port (default: 8080)
 * - NODE_ENV: Environment (development/production)
 * - OPENAI_API_KEY: OpenAI API key (optional for health checks)
 * - AFI_REACTOR_BASE_URL: AFI Reactor API URL (optional)
 *
 * Routes:
 * - GET /healthz — Health check endpoint
 *
 * @module server
 */

import { elizaLogger } from "@elizaos/core";
import { buildApp } from "./http/app.js";

/**
 * Start the HTTP server
 *
 * Binds to 0.0.0.0 for Railway compatibility.
 * Reads PORT from environment (Railway requirement).
 */
async function startServer() {
  const port = Number(process.env.PORT) || 8080;
  const host = "0.0.0.0";

  const { app, apiKeyStore } = buildApp();

  try {
    await apiKeyStore.ensureIndexes();
  } catch (err) {
    elizaLogger.error("❌ Failed to initialize API key store", err);
    process.exit(1);
  }

  try {
    app.listen(port, host, () => {
      elizaLogger.success("🚀 AFI GATEWAY — HTTP SERVER");
      elizaLogger.info(`   Listening on http://${host}:${port}`);
      elizaLogger.info(`   Environment: ${process.env.NODE_ENV || "development"}`);
      elizaLogger.info("");
      elizaLogger.info("   Available Routes:");
      elizaLogger.info("     GET  /healthz       — Health check");
      elizaLogger.info("     POST /api/v1/api-keys           — Create API key (tenant scoped)");
      elizaLogger.info("     GET  /api/v1/api-keys           — List API keys (tenant scoped)");
      elizaLogger.info("     POST /api/v1/api-keys/:keyId/revoke — Revoke API key (tenant scoped)");
      elizaLogger.info("     POST /api/v1/signals            — Ingest signal into TSSD (tenant scoped)");
      elizaLogger.info("");
    });
  } catch (error) {
    elizaLogger.error("❌ Failed to start HTTP server:", String(error));
    process.exit(1);
  }
}

// Start server only when run directly (not when imported for tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    elizaLogger.error("❌ Unhandled error in startServer():", String(error));
    process.exit(1);
  });
}

