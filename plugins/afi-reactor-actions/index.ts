/**
 * AFI Reactor Actions Plugin for ElizaOS
 *
 * Provides actions for interacting with afi-reactor's signal scoring pipeline.
 *
 * Actions provided:
 * - SUBMIT_SIGNAL_DRAFT: Submit a signal draft to AFI scoring pipeline
 * - CHECK_AFI_REACTOR_HEALTH: Check if AFI Reactor is online
 * - EXPLAIN_LAST_DECISION: Explain last signal decision
 *
 * Part of: afi-gateway integration with afi-reactor
 */

import type { Plugin, Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import {
  runFroggyTrendPullback,
  checkAfiReactorHealth,
  getAfiReactorBaseUrl,
  type TradingViewLikeDraft,
  type ReactorScoredSignalV1,
  type HealthCheckResponse,
} from "../../src/afiClient.js";

/**
 * In-memory cache for last signal result (for explanation).
 * In a real implementation, this would be stored in a database or session store.
 */
let lastSignalResult: ReactorScoredSignalV1 | null = null;

/**
 * Action: Submit Signal Draft
 *
 * Allows agents to submit a signal draft to AFI scoring pipeline.
 */
const submitSignalDraftAction: Action = {
  name: "SUBMIT_SIGNAL_DRAFT",
  description:
    "Submit a signal draft to AFI Reactor's scoring pipeline. Returns scored signal with analystScore, scoredAt, decayParams.",
  similes: [
    "Submit signal",
    "Send draft to AFI Reactor",
    "Run scoring pipeline",
    "Score this setup",
  ],
  examples: [
    [
      {
        name: "User",
        content: {
          text: "BTC/USDT 1h: Bullish pullback to 20 EMA. Swept liquidity below $67.2k, now bouncing with volume. Structure intact.",
        },
      },
      {
        name: "Agent",
        content: {
          text: "Submitting to scoring pipeline... [calls SUBMIT_SIGNAL_DRAFT action]",
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Always valid (agents can always submit drafts)
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: any
  ) => {
    try {
      // Extract draft from options or message content
      const draft: TradingViewLikeDraft = options?.draft || {
        symbol: options?.symbol || "BTC/USDT",
        timeframe: options?.timeframe || "1h",
        strategy: options?.strategy || "trend_pullback_v1",
        direction: options?.direction || "long",
        market: options?.market || "spot",
        setupSummary: options?.setupSummary || message.content?.text || "",
        notes: options?.notes,
        enrichmentProfile: options?.enrichmentProfile,
      };

      runtime.logger.info(`[SUBMIT_SIGNAL_DRAFT] Submitting draft: ${JSON.stringify(draft)}`);

      const result = await runFroggyTrendPullback(draft);

      // Cache result for explanation
      lastSignalResult = result;

      runtime.logger.info(
        `[SUBMIT_SIGNAL_DRAFT] Result: signalId=${result.signalId}, uwrScore=${result.analystScore.uwrScore}`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      runtime.logger.error(`[SUBMIT_SIGNAL_DRAFT] Error: ${String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Action: Check AFI Reactor Health
 *
 * Allows agents to check if AFI Reactor is online and ready.
 */
const checkAfiReactorHealthAction: Action = {
  name: "CHECK_AFI_REACTOR_HEALTH",
  description:
    "Check if AFI Reactor is online and ready. Returns health status and message. Read-only, no side effects.",
  similes: [
    "Is AFI Reactor online?",
    "Check AFI Reactor status",
    "Is scoring pipeline available?",
    "Health check AFI Reactor",
  ],
  validate: async () => true,
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      runtime.logger.info("[CHECK_AFI_REACTOR_HEALTH] Checking AFI Reactor health...");

      const result = await checkAfiReactorHealth();

      runtime.logger.info(`[CHECK_AFI_REACTOR_HEALTH] Status: ${result.status}`);

      return {
        success: result.status === "ok",
        data: result,
      };
    } catch (error) {
      runtime.logger.error(`[CHECK_AFI_REACTOR_HEALTH] Error: ${String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Action: Explain Last Decision
 *
 * Allows agents to retrieve and explain last scored signal.
 *
 * Updated for scored-only architecture (no validator/execution).
 */
const explainLastDecisionAction: Action = {
  name: "EXPLAIN_LAST_DECISION",
  description:
    "Retrieve last pipeline result and explain it in plain language. Returns scored signal with analystScore, scoredAt, decayParams. Read-only.",
  similes: [
    "Explain last result",
    "What was the last signal score?",
    "Tell me about the last run",
  ],
  validate: async () => true,
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      runtime.logger.info("[EXPLAIN_LAST_DECISION] Retrieving last signal result...");

      if (!lastSignalResult) {
        runtime.logger.warn("[EXPLAIN_LAST_DECISION] No signal result cached");
        return {
          success: false,
          error: "No signal result available. No signals have been submitted yet.",
        };
      }

      runtime.logger.info(
        `[EXPLAIN_LAST_DECISION] Found result: signalId=${lastSignalResult.signalId}, uwrScore=${lastSignalResult.analystScore.uwrScore}`
      );

      return {
        success: true,
        data: lastSignalResult,
      };
    } catch (error) {
      runtime.logger.error(`[EXPLAIN_LAST_DECISION] Error: ${String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * DESCRIBE_ENRICHMENT_LAYERS Action
 *
 * Action to explain enrichment legos and modular enrichment economy.
 *
 * This action helps users understand:
 * - What enrichment categories are available (technical, pattern, sentiment, news, aiMl)
 * - How enrichment legos work (modular, composable, monetizable)
 * - How contributors can build and ship custom enrichment packs
 */
export const describeEnrichmentLayersAction: Action = {
  name: "DESCRIBE_ENRICHMENT_LAYERS",
  description:
    "Explain AFI's enrichment legos and how contributors can build modular enrichment packs.",
  similes: [
    "explain enrichment",
    "what are enrichment legos",
    "how does enrichment work",
    "enrichment economy",
  ],
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "What are enrichment legos?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Let me explain AFI's enrichment legos...",
          action: "DESCRIBE_ENRICHMENT_LAYERS",
        },
      },
    ],
  ],
  validate: async () => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: any
  ) => {
    const explanation = `
🧱 **AFI Enrichment Legos — The Modular Data Economy**

**What are enrichment legos?**

Enrichment legos are modular data feeds that enrich raw signals with context before they hit the strategy layer. Think of them as "data plugins" that contributors can build, ship, and monetize.

**5 Core Categories**:

1. **Technical** 🔧
   - TA indicators: EMAs, RSI, MACD, volume, Bollinger Bands
   - Price action: support/resistance, trend strength, momentum
   - Use case: Trend-pullback setups, breakout confirmation

2. **Pattern** 📊
   - Chart patterns: flags, wedges, head-and-shoulders, triangles
   - Candlestick patterns: engulfing, hammers, dojis
   - Use case: Reversal detection, continuation patterns

3. **Sentiment** 💬
   - Social sentiment: Twitter/X, Reddit, Discord chatter
   - Funding rates, open interest, liquidation heatmaps
   - Use case: High-volatility events, crowd positioning

4. **News** 📰
   - News events: macro catalysts, regulatory updates, earnings
   - Shock detection: sudden price moves, black swan events
   - Use case: Event-driven strategies, risk management

5. **AI/ML** 🤖
   - Ensemble hints: multi-model predictions, anomaly detection
   - Regime classification: trending, ranging, volatile
   - Use case: Advanced pattern recognition, regime adaptation

---

**How do enrichment legos work?**

1. **Modular**: Each category can be enabled/disabled independently
2. **Composable**: Mix and match categories to fit your strategy
3. **Monetizable**: Contributors can build custom enrichment packs and earn AFI emissions when their legos are used

**Example**: A contributor builds a "Liquidity Sweep Detector" enrichment lego that identifies stop hunts. Validators can enable this lego in their enrichment profile. When signals using this lego get approved, the contributor earns a share of AFI emissions.

---

**Why does this matter?**

- **For Builders**: You don't need to build a full strategy. Just build a great enrichment lego and plug it into existing strategies.
- **For Validators**: You get access to a marketplace of enrichment legos to improve signal quality.
- **For AFI**: The enrichment layer becomes a composable, community-driven data economy.

---

**Current Status**:
- ✅ Technical + Pattern legos are live in the scoring pipeline
- 🚧 Sentiment, News, AI/ML legos are in development
- 🚧 Enrichment marketplace (monetization layer) is planned

**Want to build an enrichment lego?** Check out \`afi-core/analysts/froggy.enrichment_adapter.ts\` for the interface spec.
    `.trim();

    if (callback) {
      callback({
        text: explanation,
        action: "DESCRIBE_ENRICHMENT_LAYERS",
      });
    }

    return {
      success: true,
      explanation,
    };
  },
};

/**
 * AFI Reactor Actions Plugin
 *
 * ElizaOS Plugin that provides actions for interacting with afi-reactor's signal scoring pipeline.
 */
export const afiReactorActionsPlugin: Plugin = {
  name: "@afi/plugin-afi-reactor-actions",
  description:
    "Actions for interacting with AFI Reactor's signal scoring pipeline. Provides signal submission and health/explanation.",

  /**
   * Plugin initialization
   */
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    const reactorUrl = config.AFI_REACTOR_BASE_URL || process.env.AFI_REACTOR_BASE_URL || "http://localhost:8080";

    runtime.logger.info(
      `✅ AFI Reactor Actions Plugin: Initialized with Reactor URL: ${reactorUrl}`
    );
  },

  /**
   * Actions exposed to ElizaOS agents
   */
  actions: [
    submitSignalDraftAction,
    checkAfiReactorHealthAction,
    explainLastDecisionAction,
    describeEnrichmentLayersAction,
  ],

  /**
   * Plugin configuration schema
   */
  config: {
    AFI_REACTOR_BASE_URL: {
      type: "string",
      description: "AFI Reactor API URL (e.g. http://localhost:8080)",
      required: false,
    },
    WEBHOOK_SHARED_SECRET: {
      type: "string",
      description: "Optional shared secret for webhook authentication",
      required: false,
    },
  },
};

/**
 * Export plugin as default for easy import
 */
export default afiReactorActionsPlugin;
