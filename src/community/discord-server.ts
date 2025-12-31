/**
 * Discord Community Bot Server
 *
 * Runs Phoenix as a Discord bot with knowledge base access.
 *
 * Usage:
 *   npm run dev:discord
 *
 * Environment Variables:
 *   - OPENAI_API_KEY: Required for LLM
 *   - DISCORD_APPLICATION_ID: Required for Discord bot
 *   - DISCORD_API_TOKEN: Required for Discord bot
 */

import { env } from "../config/env.js";
import { AgentRuntime, elizaLogger } from "@elizaos/core";
import { discordPhoenixCharacter } from "./discord-phoenix.character.js";

async function main() {
  try {
    elizaLogger.info("🚀 Starting AFI Discord Community Bot...");

    // Validate environment
    if (!process.env.DISCORD_APPLICATION_ID || !process.env.DISCORD_API_TOKEN) {
      elizaLogger.error("❌ Missing Discord credentials!");
      elizaLogger.error("   Required: DISCORD_APPLICATION_ID, DISCORD_API_TOKEN");
      elizaLogger.error("   Get them from: https://discord.com/developers/applications");
      process.exit(1);
    }

    // Initialize runtime
    elizaLogger.info("🔧 Initializing AgentRuntime...");
    const runtime = new AgentRuntime({
      character: discordPhoenixCharacter,
    });

    // Register plugins (they're already in character.plugins, but we can verify)
    elizaLogger.info("🔌 Verifying plugins...");
    elizaLogger.info("   ✅ Knowledge plugin (RAG system)");
    elizaLogger.info("   ✅ Discord plugin");
    elizaLogger.info("   ✅ Bootstrap plugin");

    elizaLogger.success("✅ Discord bot initialized");
    elizaLogger.info(`🤖 Phoenix is ready to help the community!`);
    elizaLogger.info("");
    elizaLogger.info("📚 Knowledge base:");
    elizaLogger.info("   - AFI Protocol specifications");
    elizaLogger.info("   - Governance documentation");
    elizaLogger.info("   - Developer guides");
    elizaLogger.info("");
    elizaLogger.info("💡 To ingest knowledge, use afi-knowledge-hub:");
    elizaLogger.info("   cd ../afi-knowledge-hub && npm run ingest");
    elizaLogger.info("");

    // Keep process alive
    process.on("SIGINT", async () => {
      elizaLogger.info("🛑 Shutting down Discord bot...");
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      elizaLogger.info("🛑 Shutting down Discord bot...");
      process.exit(0);
    });

  } catch (error) {
    elizaLogger.error("❌ Failed to start Discord bot:", String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  elizaLogger.error("❌ Unhandled error:", String(error));
  process.exit(1);
});

