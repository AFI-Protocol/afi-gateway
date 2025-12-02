/**
 * Offline Telemetry Smoke Test
 *
 * This script tests the AFI telemetry plugin in offline mode (mock data only).
 * It does NOT:
 * - Call OpenAI APIs
 * - Call AFI APIs (afi-reactor, afi-core)
 * - Start Discord client
 * - Make any network requests
 *
 * Purpose:
 * - Verify that the AFI telemetry plugin actions work correctly
 * - Validate the plugin's offline mock data responses
 * - Ensure type safety and contract compliance
 *
 * Usage:
 *   npm run telemetry:offline
 */

import { afiTelemetryPlugin } from "../plugins/afi-telemetry/index.js";
import type { IAgentRuntime, Memory, State } from "@elizaos/core";

/**
 * Create a minimal fake runtime for testing
 *
 * This runtime satisfies the IAgentRuntime interface requirements
 * without connecting to any database or network.
 */
function createFakeRuntime(): IAgentRuntime {
  const settings = new Map<string, any>();

  return {
    // Core runtime properties
    agentId: "test-agent-offline",
    character: {
      id: "phoenix-test",
      name: "Phoenix (Test)",
    },

    // Settings management
    getSetting: (key: string) => settings.get(key),
    setSetting: (key: string, value: any) => {
      settings.set(key, value);
    },

    // Logger (console-based for testing)
    logger: {
      info: (msg: string) => console.log(`[INFO] ${msg}`),
      warn: (msg: string) => console.warn(`[WARN] ${msg}`),
      error: (msg: string) => console.error(`[ERROR] ${msg}`),
      debug: (msg: string) => console.debug(`[DEBUG] ${msg}`),
      success: (msg: string) => console.log(`[SUCCESS] ${msg}`),
    },

    // Stub methods (not used by telemetry plugin, but required by interface)
    getMemory: async () => [],
    addMemory: async () => {},
    updateMemory: async () => {},
    deleteMemory: async () => {},
    getState: async () => ({}),
    setState: async () => {},
    composeState: async () => ({}),
    evaluate: async () => [],
    processActions: async () => [],
  } as unknown as IAgentRuntime;
}

/**
 * Create a minimal fake message for testing
 */
function createFakeMessage(): Memory {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    entityId: "00000000-0000-0000-0000-000000000002",
    agentId: "00000000-0000-0000-0000-000000000003",
    roomId: "00000000-0000-0000-0000-000000000004",
    content: {
      text: "Test message for offline telemetry smoke test",
    },
    createdAt: Date.now(),
  } as Memory;
}

/**
 * Create a minimal fake state for testing
 */
function createFakeState(): State {
  return {} as State;
}

/**
 * Main smoke test function
 */
async function runSmokeTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  AFI Telemetry Plugin - Offline Smoke Test                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("📋 Testing AFI telemetry plugin actions in offline mode...");
  console.log("   (No OpenAI, no AFI APIs, no Discord, no network calls)");
  console.log("");

  // Create fake runtime, message, and state
  const runtime = createFakeRuntime();
  const message = createFakeMessage();
  const state = createFakeState();

  // Initialize plugin (optional, but good to test)
  if (afiTelemetryPlugin.init) {
    console.log("🔧 Initializing plugin...");
    await afiTelemetryPlugin.init({}, runtime);
    console.log("");
  }

  // Get actions from plugin
  const actions = afiTelemetryPlugin.actions || [];

  if (actions.length === 0) {
    console.error("❌ ERROR: No actions found in plugin!");
    process.exit(1);
  }

  console.log(`✅ Found ${actions.length} actions in plugin\n`);

  // Test each action
  for (const action of actions) {
    console.log("═".repeat(60));
    console.log(`📊 Action: ${action.name}`);
    console.log("─".repeat(60));
    console.log(`Description: ${action.description}`);
    console.log("");

    try {
      // Call the action handler
      const result = await action.handler(runtime, message, state, {});

      // Display result
      console.log("✅ Result:");
      console.dir(result, { depth: null, colors: true });
      console.log("");

      // Validate result structure
      if (typeof result !== "object" || result === null) {
        console.error("❌ ERROR: Result is not an object!");
        process.exit(1);
      }

      if (!("success" in result)) {
        console.error("❌ ERROR: Result missing 'success' field!");
        process.exit(1);
      }

      if (result.success && !result.data) {
        console.warn("⚠️  WARNING: Result marked as success but has no data");
      }
    } catch (error) {
      console.error("❌ ERROR: Action handler threw an exception!");
      console.error(error);
      process.exit(1);
    }
  }

  console.log("═".repeat(60));
  console.log("");
  console.log("✅ All actions tested successfully!");
  console.log("✅ Offline telemetry smoke test PASSED");
  console.log("");
}

// Run the smoke test
runSmokeTest().catch((error) => {
  console.error("❌ Smoke test failed with error:");
  console.error(error);
  process.exit(1);
});
