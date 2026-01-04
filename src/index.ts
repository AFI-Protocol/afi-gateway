/**
 * AFI ↔ Eliza Gateway Framework
 *
 * This is entrypoint for AFI-Eliza integration gateway framework.
 *
 * Purpose:
 * - Provide framework for custom character development
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
 *
 * CUSTOM CHARACTER DEVELOPMENT:
 * This gateway is now a framework for building custom characters with skills.
 * No pre-built characters are included. To add your own character:
 *
 * 1. Create a character file in src/characters/your-character.ts
 * 2. Import and start your character in this file
 * 3. See docs/CHARACTER_DEVELOPMENT.md for detailed guides
 */

// IMPORTANT: Import env config FIRST to ensure environment is loaded and validated
import { env } from "./config/env.js";
import { AgentRuntime, elizaLogger } from "@elizaos/core";
import { afiTelemetryPlugin } from "../plugins/afi-telemetry/index.js";
import { afiReactorActionsPlugin } from "../plugins/afi-reactor-actions/index.js";
import { afiScoutCharacter } from "./afiscout/index.js";
import { handleAfiCliCommand } from "./afiCli.js";
import * as readline from "readline";

/**
 * Main entrypoint for AFI Eliza Gateway Framework
 *
 * This runtime:
 * 1. Initializes ElizaOS AgentRuntime framework
 * 2. Registers plugins (bootstrap, node, AFI plugins)
 * 3. Starts agent runtime (ready for custom characters)
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
    elizaLogger.info("🚀 Starting AFI Eliza Gateway Framework...");
    elizaLogger.info("📋 Framework ready for custom character development");

    // Environment is already validated by src/config/env.ts
    // If we got here, OPENAI_API_KEY is valid and loaded

    // Initialize AgentRuntime framework (no default character)
    elizaLogger.info("🔧 Initializing AgentRuntime framework...");
    const runtime = new AgentRuntime({
      adapter: undefined, // TODO: Add database adapter when needed (e.g., SQLite, PostgreSQL)
    });

    // Register AFI Telemetry Plugin
    elizaLogger.info("🔌 Registering AFI Telemetry Plugin...");
    await runtime.registerPlugin(afiTelemetryPlugin);
    elizaLogger.info(
      "✅ AFI Telemetry Plugin registered (offline mode: mock data only)"
    );

    // Register AFI Reactor Actions Plugin
    elizaLogger.info("🔌 Registering AFI Reactor Actions Plugin...");
    await runtime.registerPlugin(afiReactorActionsPlugin);
    elizaLogger.info(
      "✅ AFI Reactor Actions Plugin registered (DEV/DEMO ONLY - no real trading)"
    );

    // Example character available (AFIScout)
    elizaLogger.info(`🔌 Example character available: ${afiScoutCharacter.name}`);

    // TODO: Register additional plugins when available:
    // - @elizaos/plugin-node (Node.js services: browser, PDF, speech, etc.)
    // - @afi/plugin-afi-skills (skill invocation via AFI APIs)

    elizaLogger.success("✅ AgentRuntime framework initialized successfully");
    elizaLogger.info("🤖 Framework ready for custom characters");

    // TODO: Start Discord client when Discord credentials are provided
    // if (process.env.DISCORD_APPLICATION_ID && process.env.DISCORD_API_TOKEN) {
    //   elizaLogger.info("🎮 Starting Discord client...");
    //   const discordClient = new DiscordClient(runtime);
    //   await discordClient.start();
    // }

    elizaLogger.info("🎯 AFI Eliza Gateway Framework is running");
    elizaLogger.info("📚 Create custom characters in src/characters/");
    elizaLogger.info("💡 See docs/CHARACTER_DEVELOPMENT.md for guides");

    // Start simple CLI interface
    elizaLogger.info("💬 Starting AFI CLI interface...");
    elizaLogger.info("   Type '/afi help' for AFI commands");
    elizaLogger.info("   Type 'exit' to quit");
    elizaLogger.info("");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "AFI> ",
    });

    rl.prompt();

    rl.on("line", async (line: string) => {
      const trimmed = line.trim();

      if (trimmed === "exit" || trimmed === "quit") {
        elizaLogger.info("👋 Goodbye!");
        rl.close();
        process.exit(0);
      }

      // Check if this is an AFI command
      if (trimmed.startsWith("/afi ") || trimmed.startsWith("afi ")) {
        const afiInput = trimmed.replace(/^\/?(afi\s+)/, "");
        try {
          const response = await handleAfiCliCommand(afiInput, runtime);
          console.log("\n" + response + "\n");
        } catch (error) {
          console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
        }
      } else if (trimmed) {
        // For non-AFI commands, show a helpful message
        console.log("\n💡 This is the AFI Gateway Framework. Use '/afi help' for available commands.\n");
        console.log("💡 To create custom characters, see docs/CHARACTER_DEVELOPMENT.md\n");
      }

      rl.prompt();
    });

    // Keep process alive
    process.on("SIGINT", async () => {
      elizaLogger.info("🛑 Shutting down AFI Eliza Gateway Framework...");
      rl.close();
      process.exit(0);
    });

  } catch (error) {
    elizaLogger.error("❌ Failed to start AFI Eliza Gateway Framework:", String(error));
    process.exit(1);
  }
}

// Start runtime
main().catch((error) => {
  elizaLogger.error("❌ Unhandled error in main():", String(error));
  process.exit(1);
});
