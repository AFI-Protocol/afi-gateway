/**
 * AFI CLI Command Handler
 *
 * Provides an AFI command namespace inside the Eliza CLI.
 * Users can invoke AFI-specific commands via:
 *   /afi reactor status
 *
 * This module routes AFI commands to the appropriate backend endpoints
 * and returns human-readable summaries.
 *
 * Architecture:
 * - This is a thin routing layer that calls existing AFI Reactor actions
 * - Custom characters can also front these same flows via natural language
 * - No duplicate logic: shared helpers are used by both CLI and custom characters
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
 * @param input - The command string after the /afi prefix (e.g., "reactor status")
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
      case "reactor":
        if (parts[1]?.toLowerCase() === "status") {
          return await getAfiReactorStatusSummary(runtime);
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
 * Get AFI Reactor status summary.
 * Calls the /health endpoint and returns a human-readable summary.
 */
async function getAfiReactorStatusSummary(runtime: IAgentRuntime): Promise<string> {
  runtime.logger.info("[AFI CLI] Checking AFI Reactor status...");

  const result: HealthCheckResponse = await checkAfiReactorHealth();

  if (result.status === "ok") {
    return `✅ **AFI Reactor is online**\n\nService: ${result.service}\nComposition: ${result.composition}`;
  } else {
    return `⚠️ **AFI Reactor status**: ${result.status}`;
  }
}

/**
 * Get AFI CLI help text.
 */
function getAfiCliHelp(): string {
  return `
**AFI Command Usage**:

  /afi reactor status       Check AFI Reactor health (scored-only pipeline)
  /afi help                 Show this help message

Submit signals for scoring via the USS webhook:
  POST /api/webhooks/tradingview   (TradingView-style payload → USS v1.1 → Froggy scoring)
  POST /api/ingest/cpj             (CPJ signals)

See afi-docs/specs/audit/AFI_TESTNET_E2E_CHECKLIST.md for the testnet flow.

**Note**: Custom characters can also run these flows via natural language.
  `.trim();
}

