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

import express, { Request, Response } from "express";
import { elizaLogger } from "@elizaos/core";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version info
// In compiled code, we're in dist/src/, so go up two levels to reach package.json
const packageJsonPath = join(__dirname, "..", "..", "package.json");
let packageVersion = "unknown";
try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  packageVersion = packageJson.version || "unknown";
} catch (err) {
  elizaLogger.warn("⚠️  Could not read package.json version", String(err));
}

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  elizaLogger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * GET /healthz
 *
 * Health check endpoint for Railway and monitoring systems.
 *
 * Returns:
 * - 200 OK with JSON status
 * - Always returns 200 even if optional dependencies are missing
 */
app.get("/healthz", (req: Request, res: Response) => {
  const health = {
    status: "ok",
    service: "afi-gateway",
    timestamp: new Date().toISOString(),
    version: packageVersion,
    environment: process.env.NODE_ENV || "development",
  };

  elizaLogger.debug("Health check requested", health);
  res.status(200).json(health);
});

/**
 * GET /
 *
 * Root endpoint - provides service information and available routes.
 *
 * Returns:
 * - 200 OK with service info and route list
 */
app.get("/", (req: Request, res: Response) => {
  const response = {
    service: "afi-gateway",
    version: packageVersion,
    description: "AFI Gateway - Framework for custom character development",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    routes: [
      { method: "GET", path: "/", description: "Service information" },
      { method: "GET", path: "/healthz", description: "Health check" },
    ],
    note: "This is the AFI Gateway framework. No pre-built characters are included. Use server-full.ts for full ElizaOS API with custom character support. See docs/CHARACTER_DEVELOPMENT.md for guides.",
  };

  elizaLogger.debug("Root endpoint requested", response);
  res.status(200).json(response);
});

/**
 * 404 handler for unknown routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "not_found",
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      "GET /",
      "GET /healthz",
    ],
  });
});

/**
 * Start the HTTP server
 *
 * Binds to 0.0.0.0 for Railway compatibility.
 * Reads PORT from environment (Railway requirement).
 */
async function startServer() {
  const port = Number(process.env.PORT) || 8080;
  const host = "0.0.0.0";

  try {
    app.listen(port, host, () => {
      elizaLogger.success("🚀 AFI GATEWAY — HTTP SERVER");
      elizaLogger.info(`   Listening on http://${host}:${port}`);
      elizaLogger.info(`   Environment: ${process.env.NODE_ENV || "development"}`);
      elizaLogger.info(`   Version: ${packageVersion}`);
      elizaLogger.info("");
      elizaLogger.info("   Available Routes:");
      elizaLogger.info("     GET  /              — Service info");
      elizaLogger.info("     GET  /healthz       — Health check");
      elizaLogger.info("");
      elizaLogger.info("   ⚠️  HTTP-only mode: No CLI interface");
      elizaLogger.info("   ⚠️  For CLI mode, run: npm run dev");
      elizaLogger.info("   💡 For custom characters, use: npm run dev:server-full");
      elizaLogger.info("   📚 See docs/CHARACTER_DEVELOPMENT.md for guides");
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

// Export app for testing
export default app;

