/**
 * Draft AFI-ready signal payload produced by AFIScout.
 * This is NOT the canonical AFI Signal schema; it is a lightweight, deterministic
 * draft used for ingestion by AFI backends.
 */
export interface AfiScoutSignalDraft {
  /** Literal source tag to identify AFIScout-originated drafts. */
  source: "afiscout";
  /** Asset symbol, e.g., "BTCUSDT". */
  symbol: string;
  /** Market category, e.g., "crypto", "equities", "fx". */
  market: string;
  /** Timeframe such as "1h", "4h", "1d". */
  timeframe: string;
  /** Intended position bias. */
  action: "long" | "short" | "flat";
  /** Brief explanation of the trade idea. */
  thesis: string;
  /** ISO timestamp when this draft was created. */
  createdAt: string;
  /** Optional regime classifier output (upstream hint). */
  regimeTag?: string;
  /** Optional free-form tags, e.g., ["momentum", "on-chain", "defi"]. */
  tags?: string[];
  /** Escape hatch for extra metadata. */
  meta?: Record<string, unknown>;
}
