/**
 * AFI Telemetry Plugin for ElizaOS
 *
 * Provides read-only, aggregated access to AFI Protocol's intelligence outputs.
 * This plugin exposes safe, filtered "What is AFI seeing?" style endpoints to Phoenix and other agents.
 *
 * Current Status: OFFLINE MODE (mock data only)
 * Future: Will call AFI HTTP/WS endpoints (afi-reactor, afi-core)
 */

import type { Plugin, Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import type {
  AFITelemetryConfig,
  MarketSummary,
  ValidatorSnapshot,
  RecentSignalHighlights,
  PluginResponse,
} from "./types.js";

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG: AFITelemetryConfig = {
  reactorUrl: process.env.AFI_REACTOR_URL,
  coreUrl: process.env.AFI_CORE_URL,
  offlineMode: true, // Default to offline until AFI endpoints are available
  cacheTtl: 60,
};

/**
 * Get market summary (aggregated market regime and cross-asset context)
 *
 * TODO: When AFI endpoints are available, call:
 * - GET ${reactorUrl}/api/v1/signals/market-summary
 * - Transform response into MarketSummary shape
 * - Add error handling and caching
 */
async function getMarketSummary(
  runtime: IAgentRuntime,
  message: Memory,
  state?: State
): Promise<PluginResponse<MarketSummary>> {
  // OFFLINE MODE: Return mock data
  const mockData: MarketSummary = {
    timestamp: new Date().toISOString(),
    regime: "transition",
    riskTier: "medium",
    assets: [
      { symbol: "BTC", sentiment: "neutral", volatility: "medium" },
      { symbol: "ETH", sentiment: "neutral", volatility: "medium" },
    ],
    summary:
      "Mock data: AFI telemetry plugin is in offline mode. No real AFI endpoints configured. This is a placeholder response for development and testing.",
  };

  return {
    status: "ok",
    data: mockData,
  };

  // TODO: Implement live mode when AFI endpoints are available:
  // const config = runtime.getSetting("afiTelemetry") as AFITelemetryConfig || DEFAULT_CONFIG;
  // if (config.offlineMode || !config.reactorUrl) {
  //   return { status: "ok", data: mockData };
  // }
  // const response = await fetch(`${config.reactorUrl}/api/v1/signals/market-summary`);
  // const data = await response.json();
  // return { status: "ok", data };
}

/**
 * Get validator snapshot (aggregated validator activity and consensus metrics)
 *
 * TODO: When AFI endpoints are available, call:
 * - GET ${coreUrl}/api/v1/validators/snapshot
 */
async function getValidatorSnapshot(
  runtime: IAgentRuntime,
  message: Memory,
  state?: State
): Promise<PluginResponse<ValidatorSnapshot>> {
  // OFFLINE MODE: Return mock data
  const mockData: ValidatorSnapshot = {
    timestamp: new Date().toISOString(),
    activeValidators: 12,
    consensusLevel: "moderate",
    topDomains: ["crypto", "macro", "defi"],
    summary:
      "Mock data: 12 active validators with moderate consensus across crypto, macro, and DeFi domains. This is placeholder data for development.",
  };

  return {
    status: "ok",
    data: mockData,
  };
}

/**
 * Get recent signal highlights (high-confidence signal summaries)
 *
 * TODO: When AFI endpoints are available, call:
 * - GET ${reactorUrl}/api/v1/signals/highlights
 */
async function getRecentSignalHighlights(
  runtime: IAgentRuntime,
  message: Memory,
  state?: State
): Promise<PluginResponse<RecentSignalHighlights>> {
  // OFFLINE MODE: Return mock data
  const mockData: RecentSignalHighlights = {
    timestamp: new Date().toISOString(),
    highlights: [
      {
        asset: "BTC",
        pattern: "consolidation",
        confidence: "medium",
        description: "BTC showing consolidation pattern near key support level",
      },
      {
        asset: "ETH",
        pattern: "divergence",
        confidence: "low",
        description: "ETH price-volume divergence detected, monitoring for confirmation",
      },
    ],
    summary:
      "Mock data: 2 signal highlights detected. This is placeholder data for development and testing.",
  };

  return {
    status: "ok",
    data: mockData,
  };
}

/**
 * Action: Get Market Summary
 *
 * ElizaOS Action that wraps getMarketSummary for agent use
 */
const getMarketSummaryAction: Action = {
  name: "GET_MARKET_SUMMARY",
  description:
    "Retrieve aggregated market regime and cross-asset context from AFI Protocol. Returns market regime (risk-on/risk-off/transition/crisis), risk tier, and asset summaries. Read-only, no financial advice.",
  similes: [
    "What is AFI seeing in the market?",
    "Get market overview",
    "Check market regime",
    "What's the current market state?",
  ],
  examples: [
    [
      {
        name: "User",
        content: { text: "What is AFI seeing in the market right now?" },
      },
      {
        name: "Phoenix",
        content: {
          text: "Let me check AFI's market summary... [calls GET_MARKET_SUMMARY action]",
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Always valid (read-only action, no preconditions)
    return true;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    const result = await getMarketSummary(runtime, message, state);
    return {
      success: result.status === "ok",
      data: result.data,
      error: result.error,
    };
  },
};

/**
 * Action: Get Validator Snapshot
 */
const getValidatorSnapshotAction: Action = {
  name: "GET_VALIDATOR_SNAPSHOT",
  description:
    "Retrieve aggregated validator activity and consensus metrics from AFI Protocol. Returns active validator count, consensus level, and top domains. Read-only.",
  similes: [
    "How are AFI validators doing?",
    "Check validator consensus",
    "What's the validator status?",
  ],
  validate: async () => true,
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    const result = await getValidatorSnapshot(runtime, message, state);
    return {
      success: result.status === "ok",
      data: result.data,
      error: result.error,
    };
  },
};

/**
 * Action: Get Recent Signal Highlights
 */
const getRecentSignalHighlightsAction: Action = {
  name: "GET_RECENT_SIGNAL_HIGHLIGHTS",
  description:
    "Retrieve recent high-confidence signal highlights from AFI Protocol. Returns asset patterns, confidence levels, and descriptions. Read-only, no financial advice.",
  similes: [
    "What signals is AFI highlighting?",
    "Show me recent AFI signals",
    "What patterns is AFI detecting?",
  ],
  validate: async () => true,
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    const result = await getRecentSignalHighlights(runtime, message, state);
    return {
      success: result.status === "ok",
      data: result.data,
      error: result.error,
    };
  },
};

/**
 * AFI Telemetry Plugin
 *
 * ElizaOS Plugin that provides read-only access to AFI Protocol's intelligence outputs.
 *
 * Current Status: OFFLINE MODE (mock data only)
 * Future: Will call AFI HTTP/WS endpoints when available
 */
export const afiTelemetryPlugin: Plugin = {
  name: "@afi/plugin-afi-telemetry",
  description:
    "Read-only, AFI-aware telemetry plugin for Phoenix and other AFI agents. Provides aggregated market summaries, validator snapshots, and signal highlights. No financial advice, no sensitive data exposure.",

  /**
   * Plugin initialization
   *
   * TODO: When AFI endpoints are available:
   * - Validate AFI_REACTOR_URL and AFI_CORE_URL
   * - Test connectivity to AFI services
   * - Initialize caching layer
   * - Set up WebSocket connections for real-time updates
   */
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    const telemetryConfig: AFITelemetryConfig = {
      reactorUrl: config.AFI_REACTOR_URL || process.env.AFI_REACTOR_URL,
      coreUrl: config.AFI_CORE_URL || process.env.AFI_CORE_URL,
      offlineMode: !config.AFI_REACTOR_URL && !process.env.AFI_REACTOR_URL,
      cacheTtl: 60,
    };

    // Store config in runtime settings
    runtime.setSetting("afiTelemetry", telemetryConfig);

    if (telemetryConfig.offlineMode) {
      runtime.logger.warn(
        "⚠️  AFI Telemetry Plugin: Running in OFFLINE MODE (mock data only). Set AFI_REACTOR_URL and AFI_CORE_URL to enable live data."
      );
    } else {
      runtime.logger.info(
        `✅ AFI Telemetry Plugin: Initialized with Reactor URL: ${telemetryConfig.reactorUrl}, Core URL: ${telemetryConfig.coreUrl}`
      );
    }
  },

  /**
   * Actions exposed to ElizaOS agents
   */
  actions: [
    getMarketSummaryAction,
    getValidatorSnapshotAction,
    getRecentSignalHighlightsAction,
  ],

  /**
   * Plugin configuration schema (for future validation)
   */
  config: {
    AFI_REACTOR_URL: {
      type: "string",
      description: "AFI Reactor API URL (e.g. http://localhost:3001)",
      required: false,
    },
    AFI_CORE_URL: {
      type: "string",
      description: "AFI Core API URL (e.g. http://localhost:3002)",
      required: false,
    },
  },
};

/**
 * Export plugin as default for easy import
 */
export default afiTelemetryPlugin;
