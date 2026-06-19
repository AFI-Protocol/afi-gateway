# AFI Reactor Actions Plugin

**ElizaOS Plugin for AFI Reactor Integration**

⚠️ **DEV/DEMO ONLY** - No real trading, no emissions.

---

## Overview

This plugin provides ElizaOS actions for interacting with afi-reactor's Froggy trend-pullback pipeline. The reactor is **scored-only**: it ingests a signal draft, enriches it, scores it (UWR), and persists the scored signal. Validator certification and execution are **not** the reactor's responsibility — they live in a downstream certification layer / consumer-adapter layer.

It enables ElizaOS characters to:

- Submit signal drafts to the Froggy scoring pipeline
- Check AFI Reactor health and explain the last scored decision

---

## Actions

### 1. SUBMIT_TRADINGVIEW_SIGNAL

**Purpose**: Submit a trend-pullback signal draft to AFI Reactor's Froggy scoring pipeline.

**Input**:
```typescript
{
  symbol: string;           // e.g. "BTC/USDT"
  timeframe: string;        // e.g. "1h", "4h"
  strategy: string;         // e.g. "trend_pullback_v1"
  direction: "long" | "short";
  market?: string;          // e.g. "spot", "perp"
  setupSummary?: string;    // Brief description of the setup
  notes?: string;           // Additional notes
  enrichmentProfile?: any;  // Optional enrichment profile
}
```

**Output** (scored signal only — `ReactorScoredSignalV1`):
```typescript
{
  success: boolean;
  data?: {
    signalId: string;
    rawUss: any;
    lenses?: any[];
    _priceFeedMetadata?: {
      source: string;
      timestamp: string;
    };
    analystScore: {
      uwrScore: number;        // 0..1
      uwrAxes: {
        structure: number;
        execution: number;
        risk: number;
        insight: number;
      };
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
  };
  error?: string;
}
```

**Example Usage**:
```
User: "BTC/USDT 1h: Bullish pullback to 20 EMA. Swept liquidity below $67.2k, now bouncing with volume."

Agent: [calls SUBMIT_TRADINGVIEW_SIGNAL action]
       "Scored! UWR score: 0.78 (structure 0.81, execution 0.74, risk 0.66, insight 0.79)."
```

---

### 2. CHECK_AFI_REACTOR_HEALTH

**Purpose**: Check if AFI Reactor is online and ready.

**Input**: None

**Output**:
```typescript
{
  success: boolean;
  data?: {
    status: "ok" | "error";
    message?: string;
    timestamp?: string;
  };
  error?: string;
}
```

**Example Usage**:
```
User: "Is AFI Reactor online?"

Agent: [calls CHECK_AFI_REACTOR_HEALTH action]
       "Yes, AFI Reactor is online and ready. The Froggy scoring pipeline is available."
```

---

### 3. EXPLAIN_LAST_DECISION

**Purpose**: Retrieve and explain the last Froggy pipeline result.

**Input**: None

**Output**:
```typescript
{
  success: boolean;
  data?: ReactorScoredSignalV1; // Same scored-only shape as SUBMIT_TRADINGVIEW_SIGNAL output
  error?: string;
}
```

**Example Usage**:
```
User: "What was the last signal result?"

Agent: [calls EXPLAIN_LAST_DECISION action]
       "The last signal was BTC/USDT 1h long. The analyst scored it 0.78 UWR — a clean trend-pullback setup with strong structure (0.81) and good volume confirmation. Certification and execution happen downstream, outside the reactor."
```

---

## Configuration

### Environment Variables

- `AFI_REACTOR_BASE_URL` (optional): AFI Reactor API URL (default: `http://localhost:8080`)
- `WEBHOOK_SHARED_SECRET` (optional): Shared secret for webhook authentication

### Example `.env`

```bash
AFI_REACTOR_BASE_URL=http://localhost:8080
WEBHOOK_SHARED_SECRET=your-secret-here  # Optional
```

---

## Integration

This plugin is automatically registered in `src/index.ts`:

```typescript
import { afiReactorActionsPlugin } from "../plugins/afi-reactor-actions/index.js";

await runtime.registerPlugin(afiReactorActionsPlugin);
```

---

## Safety & Limitations

⚠️ **DEV/DEMO ONLY**:
- No real trading or order execution
- No tokenomics or emissions logic
- Reactor is scored-only (no validator certification, no execution)
- No authentication (or optional shared secret only)
- No rate limiting

In production, this would require:
- Proper authentication (API keys, OAuth)
- Rate limiting and circuit breaking
- Audit logging and compliance

---

## Dependencies

- `@elizaos/core`: ElizaOS runtime and action types
- `../../src/afiClient.js`: AFI Reactor HTTP client

---

## See Also

- [AFI Reactor HTTP Webhook Server](../../afi-reactor/docs/HTTP_WEBHOOK_SERVER.md)
- [AFI Client](../../src/afiClient.ts)
- [Canonical Froggy Pipeline Config](../../../afi-reactor/src/config/froggyPipeline.ts)
