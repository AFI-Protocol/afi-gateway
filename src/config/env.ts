/**
 * AFI Eliza Gateway - Environment Configuration
 * 
 * Centralized environment variable loading and validation.
 * This module MUST be imported before any code that uses process.env.
 * 
 * SECURITY: Never log full API keys. Only log last 4 characters for debugging.
 */

import "dotenv/config";

/**
 * Validate and return the OpenAI API key from environment.
 * Throws if missing or invalid.
 */
function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required.\n" +
      "Please set it in your .env file or environment.\n" +
      "See .env.example for setup instructions."
    );
  }
  
  // Basic validation: OpenAI keys should start with "sk-" and be reasonably long
  if (!key.startsWith("sk-") || key.length < 20) {
    throw new Error(
      "OPENAI_API_KEY appears to be invalid.\n" +
      "OpenAI keys should start with 'sk-' and be at least 20 characters long.\n" +
      `Current key starts with: ${key.substring(0, 5)}... (length: ${key.length})`
    );
  }
  
  return key;
}

/**
 * Validated environment configuration.
 * Access these instead of process.env directly for type safety and validation.
 */
export const env = {
  /**
   * OpenAI API key (required)
   * NEVER log this value directly - use env.openaiKeyDebug for debugging
   */
  OPENAI_API_KEY: getOpenAIKey(),
  
  /**
   * Safe debug string showing only the last 4 characters of the OpenAI key
   */
  get openaiKeyDebug(): string {
    return `****${this.OPENAI_API_KEY.slice(-4)}`;
  },
  
  /**
   * AFI Reactor base URL (optional, defaults to localhost)
   */
  AFI_REACTOR_BASE_URL: process.env.AFI_REACTOR_BASE_URL || "http://localhost:8080",
  
  /**
   * MongoDB connection URI (optional)
   */
  MONGODB_URI: process.env.MONGODB_URI,
  
  /**
   * MongoDB database name (optional, defaults to "afi_eliza")
   */
  AFI_MONGO_DB_NAME: process.env.AFI_MONGO_DB_NAME || "afi_eliza",
  
  /**
   * Node environment
   */
  NODE_ENV: process.env.NODE_ENV || "development",
  
  /**
   * Server port (for HTTP server)
   * Default: 8080 (matches AFI Reactor and ElizaOS server convention)
   */
  PORT: parseInt(process.env.PORT || "8080", 10),
};

/**
 * Log environment configuration at startup (safe - no secrets logged)
 */
export function logEnvConfig(): void {
  console.log("\n" + "=".repeat(60));
  console.log("🔧 AFI Eliza Gateway - Environment Configuration");
  console.log("=".repeat(60));
  console.log(`[ENV] NODE_ENV: ${env.NODE_ENV}`);
  console.log(`[ENV] PORT: ${env.PORT}`);
  console.log(`[ENV] AFI_REACTOR_BASE_URL: ${env.AFI_REACTOR_BASE_URL}`);
  console.log(`[ENV] MONGODB_URI: ${env.MONGODB_URI ? "✅ Set" : "❌ Not set"}`);
  console.log(`[ENV] AFI_MONGO_DB_NAME: ${env.AFI_MONGO_DB_NAME}`);
  console.log(`[ENV] OPENAI_API_KEY: ✅ Set (ends with: ${env.openaiKeyDebug})`);
  console.log("=".repeat(60) + "\n");
}

// Log configuration immediately when this module is imported
// This ensures we see the config before any errors occur
logEnvConfig();

