/**
 * AFI Eliza Gateway — Full ElizaOS Server
 *
 * This server uses @elizaos/server to provide the complete ElizaOS API
 * for custom character development, including:
 * - Multi-agent runtime framework
 * - REST API (/agents, /agents/:id/message, etc.)
 * - WebSocket support for real-time chat
 * - Database persistence (optional)
 *
 * This is the production server for AFI + ElizaOS web client integration.
 *
 * CUSTOM CHARACTER DEVELOPMENT:
 * This gateway is now a framework for building custom characters with skills.
 * No pre-built characters are included. To add your own character:
 *
 * 1. Create a character file in src/characters/your-character.ts:
 *    ```typescript
 *    import type { Character } from "@elizaos/core";
 *
 *    export const yourCharacter: Character = {
 *      name: "YourCharacter",
 *      username: "yourcharacter",
 *      bio: ["Your character description"],
 *      system: "Your character's system prompt...",
 *      plugins: ["@elizaos/plugin-bootstrap", "@afi/plugin-afi-reactor-actions"],
 *      // ... other character properties
 *    };
 *    ```
 *
 * 2. Import and start your character in this file:
 *    ```typescript
 *    import { yourCharacter } from "./characters/your-character.js";
 *
 *    // In main():
 *    await server.startAgent(yourCharacter);
 *    ```
 *
 * 3. See docs/CHARACTER_DEVELOPMENT.md for detailed guides.
 */

// IMPORTANT: Import env config FIRST to ensure environment is loaded and validated
import { env } from "./config/env.js";
import { AgentServer } from "@elizaos/server";
import { elizaLogger } from "@elizaos/core";
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

    // Start custom agents
    // Import your character files and start them here:
    // import { yourCharacter } from "./characters/your-character.js";
    // await server.startAgent(yourCharacter);
    
    elizaLogger.info("🤖 No pre-built agents configured");
    elizaLogger.info("💡 To add custom characters, see docs/CHARACTER_DEVELOPMENT.md");
    elizaLogger.success("✅ Server initialized (ready for custom agents)");

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
          description: "AFI Eliza Gateway - Framework for custom character development",
          environment: process.env.NODE_ENV || "development",
          timestamp: new Date().toISOString(),
          afiAgents: [], // No pre-built agents - add your own custom characters
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
          note: "This is the AFI Eliza Gateway framework. No pre-built agents are included. Add custom characters by creating character files in src/characters/ and starting them in server-full.ts. See docs/CHARACTER_DEVELOPMENT.md for guides.",
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
    elizaLogger.info("🌐 Custom Character Development:");
    elizaLogger.info("   Create character files in src/characters/");
    elizaLogger.info("   Import and start them in server-full.ts");
    elizaLogger.info("   See docs/CHARACTER_DEVELOPMENT.md for guides");
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

