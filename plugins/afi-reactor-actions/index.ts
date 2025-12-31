/**
 * AFI Reactor Actions Plugin for ElizaOS
 *
 * DEV/DEMO ONLY - Provides actions for interacting with afi-reactor's Froggy pipeline.
 *
 * ⚠️ WARNING: This is DEV/DEMO ONLY. It assumes:
 * - afi-reactor is running locally on port 8080 (or AFI_REACTOR_BASE_URL env var)
 * - The /api/webhooks/tradingview endpoint exists
 * - Simulated execution only (no real trading)
 * - No tokenomics or emissions logic
 *
 * Actions provided:
 * - SUBMIT_FROGGY_DRAFT: Submit a signal draft to the Froggy pipeline (Alpha)
 * - CHECK_AFI_REACTOR_HEALTH: Check if AFI Reactor is online (Phoenix)
 * - EXPLAIN_FROGGY_DECISION: Explain the last Froggy decision (Phoenix)
 *
 * Part of: afi-eliza-gateway integration with afi-reactor
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
 * In-memory cache for the last Froggy result (for Phoenix to explain).
 * In a real implementation, this would be stored in a database or session store.
 */
let lastFroggyResult: ReactorScoredSignalV1 | null = null;

/**
 * Action: Submit Froggy Draft (Alpha)
 *
 * Allows Alpha Scout to submit a signal draft to the Froggy pipeline.
 */
const submitFroggyDraftAction: Action = {
  name: "SUBMIT_FROGGY_DRAFT",
  description:
    "Submit a trend-pullback signal draft to AFI Reactor's Froggy scoring pipeline. Returns scored signal with analystScore, scoredAt, decayParams. DEV/DEMO ONLY - no real trading, no emissions.",
  similes: [
    "Submit signal to Froggy",
    "Send draft to AFI Reactor",
    "Run Froggy pipeline",
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
        name: "Alpha",
        content: {
          text: "Submitting to Froggy pipeline... [calls SUBMIT_FROGGY_DRAFT action]",
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Always valid (Alpha can always submit drafts)
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
        strategy: options?.strategy || "froggy_trend_pullback_v1",
        direction: options?.direction || "long",
        market: options?.market || "spot",
        setupSummary: options?.setupSummary || message.content?.text || "",
        notes: options?.notes,
        enrichmentProfile: options?.enrichmentProfile,
      };

      runtime.logger.info(`[SUBMIT_FROGGY_DRAFT] Submitting draft: ${JSON.stringify(draft)}`);

      const result = await runFroggyTrendPullback(draft);

      // Cache result for Phoenix to explain
      lastFroggyResult = result;

      runtime.logger.info(
        `[SUBMIT_FROGGY_DRAFT] Result: signalId=${result.signalId}, uwrScore=${result.analystScore.uwrScore}`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      runtime.logger.error(`[SUBMIT_FROGGY_DRAFT] Error: ${String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Action: Check AFI Reactor Health (Phoenix)
 *
 * Allows Phoenix to check if AFI Reactor is online and ready.
 */
const checkAfiReactorHealthAction: Action = {
  name: "CHECK_AFI_REACTOR_HEALTH",
  description:
    "Check if AFI Reactor is online and ready. Returns health status and message. Read-only, no side effects.",
  similes: [
    "Is AFI Reactor online?",
    "Check AFI Reactor status",
    "Is the Froggy pipeline available?",
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
 * Action: Explain Last Froggy Decision (Phoenix)
 *
 * Allows Phoenix to retrieve and explain the last Froggy scored signal.
 *
 * Updated for scored-only architecture (no validator/execution).
 */
const explainLastFroggyDecisionAction: Action = {
  name: "EXPLAIN_LAST_FROGGY_DECISION",
  description:
    "Retrieve the last Froggy pipeline result and explain it in plain language. Returns scored signal with analystScore, scoredAt, decayParams. Read-only.",
  similes: [
    "Explain the last Froggy result",
    "What was the last signal score?",
    "Tell me about the last Froggy run",
  ],
  validate: async () => true,
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      runtime.logger.info("[EXPLAIN_LAST_FROGGY_DECISION] Retrieving last Froggy result...");

      if (!lastFroggyResult) {
        runtime.logger.warn("[EXPLAIN_LAST_FROGGY_DECISION] No Froggy result cached");
        return {
          success: false,
          error: "No Froggy result available. Alpha hasn't submitted any signals yet.",
        };
      }

      runtime.logger.info(
        `[EXPLAIN_LAST_FROGGY_DECISION] Found result: signalId=${lastFroggyResult.signalId}, uwrScore=${lastFroggyResult.analystScore.uwrScore}`
      );

      return {
        success: true,
        data: lastFroggyResult,
      };
    } catch (error) {
      runtime.logger.error(`[EXPLAIN_LAST_FROGGY_DECISION] Error: ${String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * RUN_AFI_ELIZA_DEMO Action
 *
 * ⚠️ DISABLED: The /demo/afi-eliza-demo endpoint has been removed from Reactor.
 * Reactor is now scoring-only (no demo endpoints, no validator/execution).
 *
 * Use SUBMIT_FROGGY_DRAFT action instead to submit signals to the scoring pipeline.
 */
export const runAfiElizaDemoAction: Action = {
  name: "RUN_AFI_ELIZA_DEMO",
  description:
    "DISABLED: Demo endpoint removed. Use SUBMIT_FROGGY_DRAFT instead to submit signals to the Froggy scoring pipeline.",
  similes: [
    "run afi eliza demo",
    "run afi demo",
    "show afi pipeline",
    "demo the pipeline",
    "run pipeline demo",
    "run eliza demo",
  ],
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Run the AFI Eliza demo" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Running the AFI Eliza Demo...",
          action: "RUN_AFI_ELIZA_DEMO",
        },
      },
    ],
  ],
  validate: async () => false, // Disabled
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: any
  ) => {
    runtime.logger.warn("[RUN_AFI_ELIZA_DEMO] Action is disabled (endpoint removed from Reactor)");

    const errorMessage = `
⚠️ **AFI Eliza Demo Disabled**

The /demo/afi-eliza-demo endpoint has been removed from AFI Reactor.

Reactor is now a **scoring-only pipeline** (ingest → enrich → score → persist).

To submit signals for scoring, use:
- The SUBMIT_FROGGY_DRAFT action (via Alpha Scout)
- The /api/webhooks/tradingview endpoint directly
- The /api/ingest/cpj endpoint for CPJ signals

For more information, see the AFI Reactor documentation.
    `.trim();

    if (callback) {
      callback({
        text: errorMessage,
        action: "RUN_AFI_ELIZA_DEMO",
      });
    }

    return {
      success: false,
      error: errorMessage,
    };
  },
};

/**
 * DESCRIBE_ENRICHMENT_LAYERS Action
 *
 * Pixel Rick's action to explain enrichment legos and the modular enrichment economy.
 *
 * This action helps users understand:
 * - What enrichment categories are available (technical, pattern, sentiment, news, aiMl)
 * - How enrichment legos work (modular, composable, monetizable)
 * - How contributors can build and ship custom enrichment packs
 */
export const describeEnrichmentLayersAction: Action = {
  name: "DESCRIBE_ENRICHMENT_LAYERS",
  description:
    "Explain AFI's enrichment legos and how contributors can build modular enrichment packs. Used by Pixel Rick to educate users about the enrichment economy.",
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

**Current Status** (AFI Eliza Demo):
- ✅ Technical + Pattern legos are live in the Froggy pipeline
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
 * ElizaOS Plugin that provides actions for interacting with afi-reactor's Froggy pipeline.
 *
 * DEV/DEMO ONLY - No real trading, no emissions, simulated execution only.
 */
export const afiReactorActionsPlugin: Plugin = {
  name: "@afi/plugin-afi-reactor-actions",
  description:
    "Actions for interacting with AFI Reactor's Froggy pipeline. Provides signal submission (Alpha) and health/explanation (Phoenix). DEV/DEMO ONLY.",

  /**
   * Plugin initialization
   */
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    const reactorUrl = config.AFI_REACTOR_BASE_URL || process.env.AFI_REACTOR_BASE_URL || "http://localhost:8080";

    runtime.logger.info(
      `✅ AFI Reactor Actions Plugin: Initialized with Reactor URL: ${reactorUrl}`
    );
    runtime.logger.warn(
      "⚠️  AFI Reactor Actions Plugin: DEV/DEMO ONLY - No real trading, no emissions"
    );
  },

  /**
   * Actions exposed to ElizaOS agents
   */
  actions: [
    submitFroggyDraftAction,
    checkAfiReactorHealthAction,
    explainLastFroggyDecisionAction,
    runAfiElizaDemoAction, // DEMO-ONLY: AFI Eliza Demo
    describeEnrichmentLayersAction, // Pixel Rick's enrichment legos explainer
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
