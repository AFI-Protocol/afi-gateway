/**
 * AFI Eliza Gateway — Full ElizaOS Server
 *
 * This server uses @elizaos/server to provide the complete ElizaOS API
 * for the AFI web client, including:
 * - Multi-agent runtime (Phoenix)
 * - REST API (/agents, /agents/:id/message, etc.)
 * - WebSocket support for real-time chat
 * - Database persistence (optional)
 *
 * This is the production server for AFI + ElizaOS web client integration.
 */

// IMPORTANT: Import env config FIRST to ensure environment is loaded and validated
import { env } from "./config/env.js";
import { AgentServer } from "@elizaos/server";
import { elizaLogger } from "@elizaos/core";
import { phoenixCharacter } from "./phoenix.character.js";
import afiReactorActionsPlugin from "../plugins/afi-reactor-actions/index.js";
import afiOpenAIModelsPlugin from "../plugins/afi-openai-models/index.js";

/**
 * Base plugins required for all AFI agents.
 * These provide core functionality like actions, evaluators, services, and model providers.
 */
const basePlugins = [
  afiOpenAIModelsPlugin,       // OpenAI model providers (TEXT_LARGE, TEXT_SMALL, TEXT_EMBEDDING, IMAGE_DESCRIPTION)
  "@elizaos/plugin-bootstrap", // Core actions, evaluators, providers
  "@elizaos/plugin-node",      // Node.js services (browser, PDF, speech, etc.)
  afiReactorActionsPlugin,     // AFI-specific actions
];

async function main() {
  try {
    elizaLogger.info("🚀 Starting AFI Eliza Gateway (Full Server)...");

    // Environment is already validated by src/config/env.ts
    // If we got here, OPENAI_API_KEY is valid and loaded

    // Log AFI Reactor connection
    const afiReactorUrl = process.env.AFI_REACTOR_BASE_URL || "http://localhost:8080";
    elizaLogger.info(`🔗 AFI Reactor URL: ${afiReactorUrl}`);

    // Create server instance
    elizaLogger.info("⚙️  Creating ElizaOS server...");
    const server = new AgentServer();

    const port = env.PORT;
    const dataDir = process.env.DATA_DIR || "./data/afi-eliza";

    // Initialize server with data directory
    elizaLogger.info("🔧 Initializing server...");
    await server.initialize({ dataDir });

    // Start HTTP server
    elizaLogger.info("🚀 Starting HTTP server...");
    await server.start(port);

    // Start all AFI agents
    elizaLogger.info("🤖 Starting AFI agents...");
    await server.startAgent(phoenixCharacter);

    elizaLogger.success("✅ Server initialized and agents started");

    // Add custom AFI info route to the ElizaOS server's Express app
    // Note: ElizaOS already provides /, /health, /api/agents, etc.
    // We add /api/afi/info as a custom route that doesn't conflict
    if (server.app) {
      elizaLogger.info("🔧 Adding custom AFI routes...");

      // AFI Gateway info route - provides AFI-specific metadata
      server.app.get("/api/afi/info", (req: any, res: any) => {
        res.status(200).json({
          service: "afi-eliza-gateway",
          version: "0.1.0",
          description: "AFI Eliza Gateway - Full ElizaOS Server with AFI agents",
          environment: process.env.NODE_ENV || "development",
          timestamp: new Date().toISOString(),
          afiAgents: ["Phoenix"],
          afiReactorUrl: process.env.AFI_REACTOR_BASE_URL || "http://localhost:8080",
          endpoints: {
            elizaos: [
              { method: "GET", path: "/", description: "ElizaOS Web UI" },
              { method: "GET", path: "/health", description: "ElizaOS health check" },
              { method: "GET", path: "/api/agents", description: "List all agents" },
              { method: "POST", path: "/api/agents/:id/message", description: "Send message to agent" },
              { method: "GET", path: "/api/agents/:id/rooms", description: "List agent rooms" },
            ],
            afi: [
              { method: "GET", path: "/api/afi/info", description: "AFI Gateway information" },
            ],
          },
          note: "This is the AFI Eliza Gateway running on ElizaOS. Use /api/agents to see available agents.",
        });
      });

      elizaLogger.success("✅ Custom AFI routes added");
    } else {
      elizaLogger.warn("⚠️  Could not add custom routes - server.app not available");
    }

    elizaLogger.success("🎉 AFI ELIZA GATEWAY — FULL SERVER RUNNING");
    elizaLogger.info("");
    elizaLogger.info("📡 Available endpoints:");
    elizaLogger.info(`   Root: http://localhost:${port}/`);
    elizaLogger.info(`   Health: http://localhost:${port}/health`);
    elizaLogger.info(`   API Health: http://localhost:${port}/api/health`);
    elizaLogger.info(`   Agents: http://localhost:${port}/api/agents`);
    elizaLogger.info(`   WebSocket: ws://localhost:${port}/`);
    elizaLogger.info("");
    elizaLogger.info("🌐 AFI Web Client:");
    elizaLogger.info("   Set VITE_AFI_SERVER_URL=http://localhost:" + port);
    elizaLogger.info("   Then run: bun run dev:afi-web");
    elizaLogger.info("");

    // Graceful shutdown
    const gracefulShutdown = async () => {
      elizaLogger.info("🛑 Graceful shutdown initiated...");
      await server.stop();
      elizaLogger.success("✅ Server stopped successfully");
      process.exit(0);
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    elizaLogger.error("❌ Server startup failed:", error);
    process.exit(1);
  }
}

main();

