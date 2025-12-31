/**
 * AFI CLI Command Handler
 *
 * Provides an AFI command namespace inside the Eliza CLI.
 * Users can invoke AFI-specific commands via:
 *   /afi eliza-demo
 *   /afi reactor status
 *   /afi validator explain-last
 *
 * This module routes AFI commands to the appropriate backend endpoints
 * and returns human-readable summaries.
 *
 * Architecture:
 * - This is a thin routing layer that calls existing AFI Reactor actions
 * - Phoenix can also front these same flows via natural language
 * - No duplicate logic: shared helpers are used by both CLI and Phoenix
 */

import type { IAgentRuntime } from "@elizaos/core";
import {
  checkAfiReactorHealth,
  getAfiReactorBaseUrl,
  type HealthCheckResponse,
  type ReactorScoredSignalV1,
} from "./afiClient.js";

/**
 * Handle AFI CLI commands.
 *
 * @param input - The command string after the /afi prefix (e.g., "eliza-demo", "reactor status")
 * @param runtime - The ElizaOS agent runtime
 * @returns Human-readable response string
 */
export async function handleAfiCliCommand(
  input: string,
  runtime: IAgentRuntime
): Promise<string> {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const subcommand = parts[0]?.toLowerCase();

  try {
    switch (subcommand) {
      case "eliza-demo":
        return await runAfiElizaDemoFlow(runtime);

      case "reactor":
        if (parts[1]?.toLowerCase() === "status") {
          return await getAfiReactorStatusSummary(runtime);
        }
        return getAfiCliHelp();

      case "validator":
        if (parts[1]?.toLowerCase() === "explain-last") {
          return await getLastValidatorDecisionSummary(runtime);
        }
        return getAfiCliHelp();

      case "help":
      case "":
      case undefined:
        return getAfiCliHelp();

      default:
        return `Unknown AFI command: "${subcommand}"\n\n${getAfiCliHelp()}`;
    }
  } catch (error) {
    runtime.logger.error(`[AFI CLI] Error handling command "${trimmed}":`, error);
    return `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Run the AFI Eliza Demo flow.
 *
 * DISABLED: The /demo/afi-eliza-demo endpoint has been removed from Reactor.
 * Reactor is now scoring-only (no demo endpoints).
 *
 * Use the SUBMIT_FROGGY_DRAFT action instead to submit signals to the scoring pipeline.
 */
async function runAfiElizaDemoFlow(runtime: IAgentRuntime): Promise<string> {
  runtime.logger.warn("[AFI CLI] eliza-demo command is disabled (endpoint removed from Reactor)");

  return `
⚠️ **AFI Eliza Demo Disabled**

The /demo/afi-eliza-demo endpoint has been removed from AFI Reactor.

Reactor is now a **scoring-only pipeline** (ingest → enrich → score → persist).

To submit signals for scoring, use:
- The SUBMIT_FROGGY_DRAFT action (via Alpha Scout)
- The /api/webhooks/tradingview endpoint directly
- The /api/ingest/cpj endpoint for CPJ signals

For more information, see the AFI Reactor documentation.
  `.trim();
}

/**
 * Get AFI Reactor status summary.
 * Calls the /health endpoint and returns a human-readable summary.
 */
async function getAfiReactorStatusSummary(runtime: IAgentRuntime): Promise<string> {
  runtime.logger.info("[AFI CLI] Checking AFI Reactor status...");

  const result: HealthCheckResponse = await checkAfiReactorHealth();

  if (result.status === "ok") {
    return `✅ **AFI Reactor is online**\n\nService: ${result.service}\nFroggy Pipeline: ${result.froggyPipeline}`;
  } else {
    return `⚠️ **AFI Reactor status**: ${result.status}`;
  }
}

/**
 * Get last validator decision summary.
 * Retrieves the last Froggy decision from the in-memory cache.
 */
async function getLastValidatorDecisionSummary(runtime: IAgentRuntime): Promise<string> {
  runtime.logger.info("[AFI CLI] Retrieving last validator decision...");

  // TODO: Implement proper storage/retrieval of last decision
  // For now, return a placeholder message
  return `⚠️ **Last Validator Decision**: Not yet implemented.\n\nThis feature requires persistent storage of pipeline results. Currently, decisions are only cached in-memory during the session.`;
}

/**
 * Get AFI CLI help text.
 */
function getAfiCliHelp(): string {
  return `
**AFI Command Usage**:

  /afi eliza-demo           Run the AFI Eliza Demo pipeline
  /afi reactor status       Check AFI Reactor health
  /afi validator explain-last  Explain the last validator decision (if available)
  /afi help                 Show this help message

**Note**: Phoenix can also run these flows via natural language.
  `.trim();
}

