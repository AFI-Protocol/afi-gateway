# AFI Reactor Integration Guide

**ElizaOS ↔ AFI Reactor Integration**

⚠️ **DEV/DEMO ONLY** - No real trading, no emissions.

---

## Overview

This guide explains how afi-gateway integrates with afi-reactor's Froggy trend-pullback pipeline via HTTP webhooks.

The reactor is **scored-only**: ingest → enrich → score → persist. It returns a scored signal (`ReactorScoredSignalV1`). Validator certification and execution are **downstream concerns** handled by an external certification layer / consumer-adapter layer — they are NOT reactor stages.

**Architecture**:
```
┌─────────────────────────────────────┐
│  afi-gateway                        │
│  - Signal submission (draft → score)│
│  - Health / explain actions         │
│  - AFI Reactor Actions Plugin       │
└──────────────┬──────────────────────┘
               │
               │ HTTP POST /api/webhooks/tradingview
               │ HTTP GET /health
               ▼
┌─────────────────────────────────────┐
│  afi-reactor (scored-only)          │
│  - Froggy Pipeline (6 stages)       │
│  - ingest → enrich → score → persist│
│  - Returns ReactorScoredSignalV1    │
└─────────────────────────────────────┘
               │
               │ (downstream, NOT reactor stages)
               ▼
   Certification layer → Consumer/adapter (execution)
```

---

## Quick Start

### 1. Start AFI Reactor

```bash
cd ../afi-reactor
npm run build
npm run start:demo
```

AFI Reactor will start on `http://localhost:8080` with endpoints:
- `GET /health` - Health check
- `POST /api/webhooks/tradingview` - Froggy pipeline webhook

### 2. Start AFI Gateway

```bash
cd ../afi-gateway
npm run build
npm run dev
```

AFI Gateway will start with:
- ElizaOS character(s)
- AFI Reactor Actions Plugin (registered)

### 3. Interact with Characters

**Health check**:
```
User: "Is AFI Reactor online?"
Agent: [calls CHECK_AFI_REACTOR_HEALTH]
       "Yes, AFI Reactor is online and ready."
```

**Submit signal**:
```
User: "BTC/USDT 1h: Bullish pullback to 20 EMA. Volume confirms."
Agent: [calls SUBMIT_SIGNAL_DRAFT]
       "Scored! UWR score: 0.78."
```

**Explain last decision**:
```
User: "What was the last signal result?"
Agent: [calls EXPLAIN_LAST_DECISION]
       "The last signal was BTC/USDT 1h long. The analyst scored it 0.78 UWR..."
```

---

## Actions

### SUBMIT_SIGNAL_DRAFT

**Purpose**: Submit a trend-pullback signal draft to AFI Reactor's Froggy scoring pipeline.

**Endpoint**: `POST http://localhost:8080/api/webhooks/tradingview`

**Payload**:
```json
{
  "symbol": "BTC/USDT",
  "timeframe": "1h",
  "strategy": "trend_pullback_v1",
  "direction": "long",
  "market": "spot",
  "setupSummary": "Bullish pullback to 20 EMA. Volume confirms.",
  "notes": "Optional notes",
  "enrichmentProfile": {
    "technical": true,
    "pattern": true,
    "sentiment": false,
    "news": false,
    "aiMl": false
  }
}
```

**Response** (scored signal only — `ReactorScoredSignalV1`):
```json
{
  "signalId": "sig_abc123",
  "rawUss": { "...": "canonical USS v1.1 signal" },
  "lenses": [],
  "_priceFeedMetadata": {
    "source": "demo",
    "timestamp": "2025-12-06T12:00:00Z"
  },
  "analystScore": {
    "uwrScore": 0.78,
    "uwrAxes": {
      "structure": 0.81,
      "execution": 0.74,
      "risk": 0.66,
      "insight": 0.79
    }
  },
  "scoredAt": "2025-12-06T12:00:00Z",
  "decayParams": {
    "halfLifeMinutes": 60,
    "greeksTemplateId": "trend_pullback_v1"
  },
  "meta": {
    "symbol": "BTC/USDT",
    "timeframe": "1h",
    "strategy": "trend_pullback_v1",
    "direction": "long",
    "source": "demo"
  }
}
```

> Note: the reactor does **not** return a validator decision or an execution block. UWR scoring is the final reactor step; certification and execution happen downstream.

---

### CHECK_AFI_REACTOR_HEALTH

**Purpose**: Check if AFI Reactor is online and ready.

**Endpoint**: `GET http://localhost:8080/health`

**Response**:
```json
{
  "status": "ok",
  "message": "AFI Reactor is healthy",
  "timestamp": "2025-12-06T12:00:00Z"
}
```

---

### EXPLAIN_LAST_DECISION

**Purpose**: Retrieve and explain the last Froggy pipeline result.

**Storage**: In-memory cache (session-scoped, not persisted)

**Response**: Same scored-only shape as SUBMIT_SIGNAL_DRAFT response (`ReactorScoredSignalV1`)

---

## Configuration

### Environment Variables

Create a `.env` file in `afi-gateway`:

```bash
# Required: OpenAI API key for LLM
OPENAI_API_KEY=sk-...

# Optional: AFI Reactor URL (default: http://localhost:8080)
AFI_REACTOR_BASE_URL=http://localhost:8080

# Optional: Webhook shared secret (for authentication)
WEBHOOK_SHARED_SECRET=your-secret-here

# Optional: Discord bot credentials (for Discord client)
# DISCORD_APPLICATION_ID=your_discord_app_id
# DISCORD_API_TOKEN=your_discord_bot_token
```

---

## Froggy Pipeline Stages

When a signal draft is submitted, it flows through 6 stages in afi-reactor (source of truth: `afi-reactor/src/config/froggyPipeline.ts`). The flow is **ingest → enrich → score → persist**:

1. **USS Telemetry Deriver** (`uss-telemetry-deriver`, internal) - Extract routing/debug fields from `context.rawUss` into `context.telemetry`
2. **Froggy Enrichment (Tech + Pattern)** (`froggy-enrichment-tech-pattern`) - Technical indicators + pattern recognition *(parallel branch 1)*
3. **Froggy Enrichment (Sentiment + News)** (`froggy-enrichment-sentiment-news`) - Sentiment + news enrichment *(parallel branch 2, runs alongside stage 2)*
4. **Froggy Enrichment Adapter** (`froggy-enrichment-adapter`) - Merge enrichment legos + optional AI/ML (joins both branches)
5. **Froggy Analyst** (`froggy-analyst`) - Run `trend_pullback_v1` strategy, compute UWR score
6. **Reactor Scored Signal Vault Write** (`tssd-vault-write`, internal) - Persist scored signal

> **Validator certification and execution are NOT reactor stages.** They were removed from the pipeline and moved downstream: certification lives in an external certification layer, and execution lives in the consumer/adapter layer.

---

## Safety & Limitations

⚠️ **DEV/DEMO ONLY**:
- No real trading or order execution
- No tokenomics or emissions logic
- Reactor is scored-only (no validator certification, no execution)
- No authentication (or optional shared secret only)
- No rate limiting
- In-memory session cache (not persisted)

In production, this would require:
- Proper authentication (API keys, OAuth)
- Rate limiting and circuit breaking
- Persistent storage for signal history
- Audit logging and compliance

---

## Troubleshooting

### AFI Reactor not reachable

**Error**: `Failed to run Froggy pipeline: fetch failed`

**Solution**:
1. Check AFI Reactor is running: `curl http://localhost:8080/health`
2. Check `AFI_REACTOR_BASE_URL` env var is correct
3. Check firewall/network settings

### Action not found

**Error**: `Action SUBMIT_SIGNAL_DRAFT not found`

**Solution**:
1. Check plugin is registered in `src/index.ts`
2. Rebuild: `npm run build`
3. Restart: `npm run dev`

### No decision available

**Error**: `No signal result available. No signals have been submitted yet.`

**Solution**:
1. Submit a signal first using the SUBMIT_SIGNAL_DRAFT action
2. Then call the EXPLAIN_LAST_DECISION action

---

## See Also

- [AFI Reactor HTTP Webhook Server](../../afi-reactor/docs/HTTP_WEBHOOK_SERVER.md)
- [AFI Reactor Actions Plugin](../plugins/afi-reactor-actions/README.md)
- [AFI Client](../src/afiClient.ts)
- [Canonical Froggy Pipeline Config](../../afi-reactor/src/config/froggyPipeline.ts)
