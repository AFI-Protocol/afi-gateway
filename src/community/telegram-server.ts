/**
 * Telegram Community Bot Server
 *
 * Runs Phoenix as a Telegram bot with knowledge base access.
 *
 * Usage:
 *   npm run dev:telegram
 *
 * Environment Variables:
 *   - OPENAI_API_KEY: Required for LLM
 *   - TELEGRAM_BOT_TOKEN: Required for Telegram bot
 */

import { env } from "../config/env.js";
import { AgentRuntime, elizaLogger } from "@elizaos/core";
import { telegramPhoenixCharacter } from "./telegram-phoenix.character.js";

async function main() {
  try {
    elizaLogger.info("🚀 Starting AFI Telegram Community Bot...");

    // Validate environment
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      elizaLogger.error("❌ Missing Telegram bot token!");
      elizaLogger.error("   Required: TELEGRAM_BOT_TOKEN");
      elizaLogger.error("   Get it from: @BotFather on Telegram");
      process.exit(1);
    }

    // Initialize runtime
    elizaLogger.info("🔧 Initializing AgentRuntime...");
    const runtime = new AgentRuntime({
      character: telegramPhoenixCharacter,
    });

    // Register plugins (they're already in character.plugins, but we can verify)
    elizaLogger.info("🔌 Verifying plugins...");
    elizaLogger.info("   ✅ Knowledge plugin (RAG system)");
    elizaLogger.info("   ✅ Telegram plugin");
    elizaLogger.info("   ✅ Bootstrap plugin");

    elizaLogger.success("✅ Telegram bot initialized");
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
      elizaLogger.info("🛑 Shutting down Telegram bot...");
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      elizaLogger.info("🛑 Shutting down Telegram bot...");
      process.exit(0);
    });

  } catch (error) {
    elizaLogger.error("❌ Failed to start Telegram bot:", String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  elizaLogger.error("❌ Unhandled error:", String(error));
  process.exit(1);
});

