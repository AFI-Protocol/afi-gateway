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
  type FroggyPipelineResult,
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
 * Calls the /demo/afi-eliza-demo endpoint and returns a narrative summary.
 */
async function runAfiElizaDemoFlow(runtime: IAgentRuntime): Promise<string> {
  runtime.logger.info("[AFI CLI] Running AFI Eliza Demo...");

  const baseUrl = getAfiReactorBaseUrl();
  const endpoint = `${baseUrl}/demo/afi-eliza-demo`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AFI Reactor returned ${response.status}: ${errorText}`);
  }

  const result: FroggyPipelineResult = await response.json();

  // Build narrative summary
  const stageNarrative = result.stageSummaries
    ? result.stageSummaries
        .map((stage: any, index: number) => {
          let line = `${index + 1}. ✅ ${stage.persona} (${stage.stage}): ${stage.summary}`;
          if (stage.enrichmentCategories) {
            line += `\n   Enrichment: ${stage.enrichmentCategories.join(", ")}`;
          }
          if (stage.uwrScore !== undefined) {
            line += `\n   UWR Score: ${stage.uwrScore.toFixed(2)}`;
          }
          if (stage.decision) {
            line += `\n   Decision: ${stage.decision}`;
          }
          return line;
        })
        .join("\n\n")
    : "Stage summaries not available";

  return `
🎯 **AFI Eliza Demo Complete**

**Signal**: ${result.meta?.symbol || "N/A"} ${result.meta?.timeframe || ""} ${result.meta?.direction || ""}
**Strategy**: ${result.meta?.strategy || "N/A"}

**Pipeline Flow**:
${stageNarrative}

---

**Final Decision**: ${result.validatorDecision?.decision || "N/A"} (confidence: ${result.validatorDecision?.uwrConfidence?.toFixed(2) || "N/A"})
**Execution**: ${result.execution?.status || "N/A"} - ${result.execution?.type || "N/A"} ${result.execution?.amount || ""} ${result.execution?.asset || ""} @ ${result.execution?.simulatedPrice || "N/A"}

⚠️ **DEMO ONLY**: No real trading. No AFI tokens minted.
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

