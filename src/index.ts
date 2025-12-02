/**
 * AFI ↔ Eliza Gateway
 *
 * This is the entrypoint for the AFI-Eliza integration gateway.
 *
 * Purpose:
 * - Bootstrap Phoenix/Eliza runtime with AFI-specific character configs
 * - Wire AFI-specific Eliza plugins
 * - Provide client code that calls AFI services (Reactor/Codex/Core) over HTTP/WS
 *
 * Architecture:
 * - This gateway is an EXTERNAL CLIENT of AFI services
 * - It MUST call AFI APIs (afi-reactor, afi-core) over HTTP/WS
 * - It MUST NOT reimplement AFI scoring, signal logic, or tokenomics
 * - It uses types and client libraries from afi-core
 *
 * Dependency Direction:
 * - Eliza gateway (this repo) → depends on → AFI services (afi-reactor, afi-core)
 * - AFI services NEVER depend on this gateway
 */

import { AgentRuntime, elizaLogger } from "@elizaos/core";
import { phoenixCharacter } from "./phoenix.character.js";
import { afiTelemetryPlugin } from "../plugins/afi-telemetry/index.js";
import { afiScoutCharacter } from "./afiscout/index.js";

/**
 * Main entrypoint for AFI Eliza Gateway
 *
 * This runtime:
 * 1. Loads the Phoenix character configuration
 * 2. Initializes the ElizaOS AgentRuntime
 * 3. Registers plugins (bootstrap, node, future AFI plugins)
 * 4. Starts the agent runtime
 *
 * Environment Variables Required:
 * - OPENAI_API_KEY: OpenAI API key for LLM (if using OpenAI)
 * - DISCORD_APPLICATION_ID: Discord application ID (if using Discord client)
 * - DISCORD_API_TOKEN: Discord bot token (if using Discord client)
 * - AFI_REACTOR_URL: URL for AFI Reactor API (future, for AFI telemetry plugin)
 * - AFI_CORE_URL: URL for AFI Core API (future, for AFI skills plugin)
 */
async function main() {
  try {
    elizaLogger.info("🚀 Starting AFI Eliza Gateway...");
    elizaLogger.info(`📋 Loading Phoenix character: ${phoenixCharacter.name}`);

    // Validate required environment variables
    const requiredEnvVars = ["OPENAI_API_KEY"];
    const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

    if (missingEnvVars.length > 0) {
      elizaLogger.warn(
        `⚠️  Missing environment variables: ${missingEnvVars.join(", ")}`
      );
      elizaLogger.warn(
        "⚠️  Some features may not work. See README.md for setup instructions."
      );
    }

    // Initialize AgentRuntime with Phoenix character by default
    elizaLogger.info("🔧 Initializing AgentRuntime...");
    const runtime = new AgentRuntime({
      character: phoenixCharacter,
      adapter: undefined, // TODO: Add database adapter when needed (e.g., SQLite, PostgreSQL)
    });

    // Register AFI Telemetry Plugin
    elizaLogger.info("🔌 Registering AFI Telemetry Plugin...");
    await runtime.registerPlugin(afiTelemetryPlugin);
    elizaLogger.info(
      "✅ AFI Telemetry Plugin registered (offline mode: mock data only)"
    );

    // Optional: register AFIScout character as an alternate profile
    elizaLogger.info(`🔌 AFIScout character available: ${afiScoutCharacter.name}`);

    // TODO: Register additional plugins when available:
    // - @elizaos/plugin-node (Node.js services: browser, PDF, speech, etc.)
    // - @afi/plugin-afi-skills (skill invocation via AFI APIs)

    elizaLogger.success("✅ AgentRuntime initialized successfully");
    elizaLogger.info(`🤖 Phoenix is ready: ${phoenixCharacter.bio[0]}`);

    // TODO: Start Discord client when Discord credentials are provided
    // if (process.env.DISCORD_APPLICATION_ID && process.env.DISCORD_API_TOKEN) {
    //   elizaLogger.info("🎮 Starting Discord client...");
    //   const discordClient = new DiscordClient(runtime);
    //   await discordClient.start();
    // }

    elizaLogger.info("🎯 AFI Eliza Gateway is running");
    elizaLogger.info("📚 Phoenix is ready to explain AFI Protocol");

    // Keep the process alive
    process.on("SIGINT", async () => {
      elizaLogger.info("🛑 Shutting down AFI Eliza Gateway...");
      // TODO: Cleanup runtime, close connections
      process.exit(0);
    });

  } catch (error) {
    elizaLogger.error("❌ Failed to start AFI Eliza Gateway:", String(error));
    process.exit(1);
  }
}

// Start the runtime
main().catch((error) => {
  elizaLogger.error("❌ Unhandled error in main():", String(error));
  process.exit(1);
});
