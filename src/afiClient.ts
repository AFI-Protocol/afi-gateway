/**
 * AFI Client - Dev/Demo Only
 *
 * Purpose: Minimal HTTP client for calling afi-reactor's Froggy pipeline.
 *
 * ⚠️ WARNING: This is DEV/DEMO ONLY. It assumes:
 * - afi-reactor is running locally on port 8080 (or AFI_REACTOR_BASE_URL env var)
 * - The /api/webhooks/tradingview endpoint exists
 * - No authentication (or optional shared secret via WEBHOOK_SHARED_SECRET)
 * - No rate limiting
 * - Simulated execution only (no real trading)
 * - No tokenomics or emissions logic
 *
 * In production, this would:
 * - Use proper authentication (API keys, OAuth, etc.)
 * - Handle retries and circuit breaking
 * - Support multiple environments (dev, staging, prod)
 * - Include telemetry and logging
 *
 * Part of: afi-eliza-gateway integration with afi-reactor
 */

/**
 * TradingView-like signal draft.
 * This is the shape that Alpha Scout agents send to the Froggy pipeline.
 * Matches the TradingViewAlertPayload interface from afi-reactor.
 */
export interface TradingViewLikeDraft {
  symbol: string;
  timeframe: string;
  strategy: string;
  direction: "long" | "short";
  market?: string;
  setupSummary?: string;
  notes?: string;
  enrichmentProfile?: any; // Optional enrichment profile (keep loose for now)
}

/**
 * Reactor Scored Signal V1 (Response Contract)
 *
 * This is what Reactor returns from ingestion endpoints.
 * Reactor's responsibility: ingest → enrich → score → persist.
 *
 * NOT Reactor's responsibility:
 * - Validator certification (moved to external certification layer)
 * - Execution (moved to consumer/adapter layer)
 * - Minting/emissions (moved to afi-mint)
 */
export interface ReactorScoredSignalV1 {
  signalId: string;
  rawUss: any;
  lenses?: any[];
  _priceFeedMetadata?: {
    source: string;
    timestamp: string;
    [key: string]: any;
  };
  analystScore: {
    uwrScore: number;
    uwrAxes: {
      utility: number;
      workQuality: number;
      rarity: number;
    };
    [key: string]: any;
  };
  scoredAt: string;
  decayParams: {
    halfLifeMinutes: number;
    greeksTemplateId: string;
  } | null;
  meta: {
    symbol: string;
    timeframe: string;
    strategy: string;
    direction: string;
    source: string;
  };
}

/**
 * Health check response from AFI Reactor.
 */
export interface HealthCheckResponse {
  status: "ok" | "error";
  message?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Get AFI Reactor base URL from environment or use default.
 */
export function getAfiReactorBaseUrl(): string {
  return process.env.AFI_REACTOR_BASE_URL || "http://localhost:8080";
}

/**
 * Run Froggy trend_pullback_v1 scoring pipeline on a signal draft.
 *
 * This sends the draft to afi-reactor's Froggy pipeline endpoint,
 * which processes it through:
 * 1. Ingest → USS normalization
 * 2. Enrichment (technical, pattern, sentiment, news, optional AI/ML)
 * 3. Analyst scoring (trend_pullback_v1)
 * 4. Vault persistence
 *
 * Returns ReactorScoredSignalV1 (scored signal only).
 * Validator certification and execution are NOT Reactor's responsibility.
 *
 * @param draft - TradingView-like signal draft
 * @returns Reactor scored signal with analystScore, scoredAt, decayParams
 *
 * @throws Error if the request fails or returns non-2xx status
 */
export async function runFroggyTrendPullback(
  draft: TradingViewLikeDraft
): Promise<ReactorScoredSignalV1> {
  const baseUrl = getAfiReactorBaseUrl();
  const endpoint = `${baseUrl}/api/webhooks/tradingview`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Optional: Add shared secret authentication if configured
    const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;
    if (sharedSecret) {
      headers["x-webhook-secret"] = sharedSecret;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AFI Reactor returned ${response.status}: ${errorText}`
      );
    }

    const result = await response.json();
    return result as ReactorScoredSignalV1;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to run Froggy pipeline: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Health check for AFI Reactor.
 *
 * @returns Health check response with status and message
 *
 * @throws Error if the request fails
 */
export async function checkAfiReactorHealth(): Promise<HealthCheckResponse> {
  const baseUrl = getAfiReactorBaseUrl();
  const endpoint = `${baseUrl}/health`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
    });

    if (!response.ok) {
      return {
        status: "error",
        message: `Health check failed with status ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      status: "ok",
      ...result,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        status: "error",
        message: `Health check failed: ${error.message}`,
      };
    }
    return {
      status: "error",
      message: "Health check failed with unknown error",
    };
  }
}

