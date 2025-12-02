/**
 * Type definitions for AFI Telemetry Plugin
 *
 * These types define the shape of data returned by the plugin's actions.
 * All types are designed for read-only, aggregated, public-safe data.
 */

/**
 * Market regime classification
 */
export type MarketRegime = "risk-on" | "risk-off" | "transition" | "crisis";

/**
 * Risk tier classification
 */
export type RiskTier = "low" | "medium" | "high" | "extreme";

/**
 * Sentiment classification
 */
export type Sentiment = "bullish" | "bearish" | "neutral";

/**
 * Volatility classification
 */
export type Volatility = "low" | "medium" | "high";

/**
 * Confidence level
 */
export type Confidence = "high" | "medium" | "low";

/**
 * Consensus level
 */
export type ConsensusLevel = "strong" | "moderate" | "weak";

/**
 * Asset summary (aggregated view)
 */
export interface AssetSummary {
  symbol: string;
  sentiment: Sentiment;
  volatility: Volatility;
}

/**
 * Market summary response
 */
export interface MarketSummary {
  timestamp: string;
  regime: MarketRegime;
  riskTier: RiskTier;
  assets: AssetSummary[];
  summary: string;
}

/**
 * Validator snapshot response
 */
export interface ValidatorSnapshot {
  timestamp: string;
  activeValidators: number;
  consensusLevel: ConsensusLevel;
  topDomains: string[];
  summary: string;
}

/**
 * Signal highlight (aggregated view)
 */
export interface SignalHighlight {
  asset: string;
  pattern: string;
  confidence: Confidence;
  description: string;
}

/**
 * Recent signal highlights response
 */
export interface RecentSignalHighlights {
  timestamp: string;
  highlights: SignalHighlight[];
  summary: string;
}

/**
 * Generic plugin response wrapper
 */
export interface PluginResponse<T> {
  status: "ok" | "error";
  data?: T;
  error?: string;
}

/**
 * AFI Telemetry Plugin configuration
 */
export interface AFITelemetryConfig {
  /**
   * AFI Reactor API URL (for signal queries, DAG introspection)
   * Example: "http://localhost:3001" or "https://reactor.afi.protocol"
   */
  reactorUrl?: string;

  /**
   * AFI Core API URL (for validator queries, scoring)
   * Example: "http://localhost:3002" or "https://core.afi.protocol"
   */
  coreUrl?: string;

  /**
   * Enable offline mode (return mock data instead of calling APIs)
   * Default: true (until AFI endpoints are available)
   */
  offlineMode?: boolean;

  /**
   * Cache TTL in seconds (for future caching layer)
   * Default: 60 seconds
   */
  cacheTtl?: number;
}

