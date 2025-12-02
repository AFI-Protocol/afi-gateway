# @afi/plugin-afi-telemetry

**AFI Telemetry Plugin for ElizaOS**

Read-only, AFI-aware telemetry plugin that exposes safe, filtered "What is AFI seeing?" style endpoints to Phoenix and other AFI agents.

---

## Purpose

This plugin provides Phoenix (and future AFI agents) with controlled access to AFI Protocol's intelligence outputs. It acts as a safe query layer between conversational agents and AFI's signal processing infrastructure.

**What it does**:
- Exposes aggregated, public-safe summaries of AFI signal data
- Provides read-only views into market regimes, validator activity, and signal highlights
- Translates AFI's internal signal lifecycle into human-readable narratives
- Enforces safety boundaries (no raw data, no sensitive internals, no operational access)

**What it does NOT do**:
- Write to AFI databases or modify signal state
- Expose raw signal rows, internal IDs, or sensitive metadata
- Provide financial advice or trade recommendations
- Execute transactions or sign contracts
- Access HIGH-risk components (token contracts, governance signers, validator operations)

---

## Design Constraints

### Read-Only Access

All plugin functions are **read-only**. No mutations, no writes, no admin operations.

### No Direct Database Queries

Phoenix and other agents MUST NOT query AFI databases directly. All data access flows through:
1. AFI HTTP/WS APIs (afi-reactor, afi-core)
2. Pre-digested, aggregated endpoints
3. This plugin's safe query layer

### No Raw Data Exposure

The plugin NEVER returns:
- Raw signal rows or database records
- Internal signal IDs or validator IDs
- Wallet addresses or private identifiers
- Sensitive operational details (API keys, secrets, internal state)

### Governance & Risk Alignment

The plugin respects AFI's governance model and risk tiers:
- **HIGH risk components**: Token contracts, governance signers, validator operations (NO ACCESS)
- **MEDIUM risk components**: Public-facing APIs, aggregated views (READ-ONLY ACCESS)
- **LOW risk components**: Documentation, educational content (FULL ACCESS)

---

## Conceptual API Surface

The plugin exposes the following actions to ElizaOS agents:

### `getMarketSummary`

**Purpose**: Retrieve aggregated market regime and cross-asset context

**Returns**:
```typescript
{
  status: "ok" | "error",
  data: {
    timestamp: string,           // ISO 8601 timestamp
    regime: string,              // "risk-on" | "risk-off" | "transition" | "crisis"
    riskTier: string,            // "low" | "medium" | "high" | "extreme"
    assets: Array<{
      symbol: string,            // e.g. "BTC", "ETH"
      sentiment: string,         // "bullish" | "bearish" | "neutral"
      volatility: string,        // "low" | "medium" | "high"
    }>,
    summary: string,             // Human-readable narrative
  }
}
```

### `getValidatorSnapshot`

**Purpose**: Retrieve aggregated validator activity and consensus metrics

**Returns**:
```typescript
{
  status: "ok" | "error",
  data: {
    timestamp: string,
    activeValidators: number,    // Count of active validators
    consensusLevel: string,      // "strong" | "moderate" | "weak"
    topDomains: string[],        // e.g. ["crypto", "macro", "defi"]
    summary: string,
  }
}
```

### `getRecentSignalHighlights`

**Purpose**: Retrieve recent high-confidence signal highlights

**Returns**:
```typescript
{
  status: "ok" | "error",
  data: {
    timestamp: string,
    highlights: Array<{
      asset: string,             // e.g. "BTC"
      pattern: string,           // e.g. "breakout", "reversal", "divergence"
      confidence: string,        // "high" | "medium" | "low"
      description: string,       // Human-readable summary
    }>,
    summary: string,
  }
}
```

---

## Runtime Behavior

### Current (Offline Mode)

All functions return **static mock data** or simple placeholder objects. No network calls, no API keys required, no external dependencies.

**Example**:
```typescript
getMarketSummary() => {
  status: "ok",
  data: {
    timestamp: new Date().toISOString(),
    regime: "transition",
    riskTier: "medium",
    assets: [
      { symbol: "BTC", sentiment: "neutral", volatility: "medium" },
      { symbol: "ETH", sentiment: "neutral", volatility: "medium" },
    ],
    summary: "Mock data: AFI telemetry plugin is in offline mode. No real AFI endpoints configured.",
  }
}
```

### Future (Live Mode)

When AFI HTTP/WS endpoints are available, functions will:
1. Check for `AFI_REACTOR_URL` and `AFI_CORE_URL` environment variables
2. Call AFI APIs over HTTP/WS (using `fetch` or WebSocket clients)
3. Transform AFI responses into safe, aggregated views
4. Return structured data with human-readable summaries

**Anticipated AFI Endpoints** (conceptual, not yet implemented):
- `GET /api/v1/signals/market-summary` (afi-reactor)
- `GET /api/v1/validators/snapshot` (afi-core)
- `GET /api/v1/signals/highlights` (afi-reactor)
- `WS /api/v1/signals/stream` (afi-reactor, for real-time updates)

---

## Safety Posture

### No Sensitive Data

The plugin NEVER returns:
- Individual wallet addresses
- Private validator identifiers
- Internal signal IDs or database keys
- Sensitive operational details

### Aggregated Views Only

All data is pre-aggregated and public-safe:
- Market regime summaries (not individual trades)
- Validator consensus metrics (not individual validator scores)
- Signal highlights (not raw signal rows)

### Disclaimers

All responses include implicit disclaimers:
- "This is intelligence, not advice"
- "AFI provides data and analysis, not trade recommendations"
- "You are responsible for your own financial decisions"

Phoenix's system prompt reinforces these boundaries.

---

## Integration with Phoenix

Phoenix references this plugin in her `plugins` array:

```typescript
plugins: [
  "@elizaos/plugin-bootstrap",
  "@elizaos/plugin-node",
  "@afi/plugin-afi-telemetry",  // This plugin
]
```

Phoenix's system prompt includes guidance on using telemetry:
- "Describe what AFI is seeing using approved data sources (when available)"
- "If data is missing or stale, say so instead of guessing"
- "Separate facts from interpretations"

---

## Future Work

**TODO**:
- Implement real AFI HTTP/WS client code (when afi-reactor and afi-core expose endpoints)
- Add caching layer to reduce API load
- Add rate limiting and error handling
- Add telemetry for plugin usage (how often Phoenix queries AFI data)
- Add support for parameterized queries (e.g. `getMarketSummary({ asset: "BTC" })`)
- Add WebSocket support for real-time signal streaming

**Dependencies** (future):
- `afi-reactor` HTTP/WS endpoints
- `afi-core` HTTP/WS endpoints
- AFI client libraries (from `afi-core` repo)

---

## Governance Alignment

This plugin implements the telemetry access model described in:
- `afi-config/codex/governance/agents/PHOENIX_PERSONA.v0.1.md` (Section 4: Knowledge)
- `afi-config/codex/governance/agents/AFI_AGENT_UNIVERSE.v0.1.md` (Section 3.1: Phoenix)

**Risk Level**: MEDIUM (public-facing, talks about markets, but read-only and aggregated)

---

**Version**: 0.1.0 (offline mode)  
**Status**: Scaffold only, mock data  
**Maintainers**: AFI Protocol Team

