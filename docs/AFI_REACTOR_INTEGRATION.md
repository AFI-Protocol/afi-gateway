# AFI Reactor Integration Guide

**ElizaOS ↔ AFI Reactor Integration**

⚠️ **DEV/DEMO ONLY** - No real trading, no emissions, simulated execution only.

---

## Overview

This guide explains how afi-gateway integrates with afi-reactor's Froggy trend-pullback pipeline via HTTP webhooks.

**Architecture**:
```
┌─────────────────────────────────────┐
│  afi-gateway                        │
│  - Alpha Scout (signal submission)  │
│  - Phoenix Guide (health/explain)   │
│  - AFI Reactor Actions Plugin       │
└──────────────┬──────────────────────┘
               │
               │ HTTP POST /api/webhooks/tradingview
               │ HTTP GET /health
               ▼
┌─────────────────────────────────────┐
│  afi-reactor                        │
│  - Froggy Pipeline (6 stages)       │
│  - Validator Decision Evaluator     │
│  - Execution Agent Sim              │
└─────────────────────────────────────┘
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
- Phoenix character (default)
- Alpha character (available)
- AFI Reactor Actions Plugin (registered)

### 3. Interact with Characters

**Phoenix** (health check):
```
User: "Is AFI Reactor online?"
Phoenix: [calls CHECK_AFI_REACTOR_HEALTH]
         "Yes, AFI Reactor is online and ready."
```

**Alpha** (submit signal):
```
User: "BTC/USDT 1h: Bullish pullback to 20 EMA. Volume confirms."
Alpha: [calls SUBMIT_FROGGY_DRAFT]
       "Froggy approved! Decision: approve, Confidence: 0.78."
```

**Phoenix** (explain decision):
```
User: "What was the last signal result?"
Phoenix: [calls EXPLAIN_LAST_FROGGY_DECISION]
         "The last signal was BTC/USDT 1h long. Froggy approved it..."
```

---

## Actions

### SUBMIT_FROGGY_DRAFT (Alpha)

**Purpose**: Submit a trend-pullback signal draft to AFI Reactor's Froggy pipeline.

**Endpoint**: `POST http://localhost:8080/api/webhooks/tradingview`

**Payload**:
```json
{
  "symbol": "BTC/USDT",
  "timeframe": "1h",
  "strategy": "froggy_trend_pullback_v1",
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

**Response**:
```json
{
  "signalId": "sig_abc123",
  "validatorDecision": {
    "decision": "approve",
    "uwrConfidence": 0.78,
    "reasonCodes": ["trend_confirmed", "volume_ok"]
  },
  "execution": {
    "status": "simulated",
    "type": "buy",
    "asset": "BTC",
    "amount": 0.1,
    "simulatedPrice": 67500,
    "timestamp": "2025-12-06T12:00:00Z"
  }
}
```

---

### CHECK_AFI_REACTOR_HEALTH (Phoenix)

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

### EXPLAIN_LAST_FROGGY_DECISION (Phoenix)

**Purpose**: Retrieve and explain the last Froggy pipeline decision.

**Storage**: In-memory cache (session-scoped, not persisted)

**Response**: Same as SUBMIT_FROGGY_DRAFT response

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

When Alpha submits a signal, it flows through 6 stages in afi-reactor:

1. **Alpha Scout Ingest** - Normalize TradingView-like payload
2. **Signal Structurer (Pixel Rick)** - Convert to USS (Universal Signal Schema)
3. **Froggy Enrichment Adapter** - Apply enrichment profile
4. **Froggy Analyst (trend_pullback_v1)** - Analyze trend-pullback setup
5. **Validator Decision Evaluator (Val Dook)** - Make approve/reject decision
6. **Execution Agent Sim** - Simulate execution (no real trading)

---

## Safety & Limitations

⚠️ **DEV/DEMO ONLY**:
- No real trading or order execution
- No tokenomics or emissions logic
- Simulated execution only
- No authentication (or optional shared secret only)
- No rate limiting
- In-memory session cache (not persisted)

In production, this would require:
- Proper authentication (API keys, OAuth)
- Rate limiting and circuit breaking
- Real execution integration (with proper risk controls)
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

**Error**: `Action SUBMIT_FROGGY_DRAFT not found`

**Solution**:
1. Check plugin is registered in `src/index.ts`
2. Rebuild: `npm run build`
3. Restart: `npm run dev`

### No Froggy decision available

**Error**: `No Froggy decision available. Alpha hasn't submitted any signals yet.`

**Solution**:
1. Submit a signal first using Alpha's SUBMIT_FROGGY_DRAFT action
2. Then call Phoenix's EXPLAIN_LAST_FROGGY_DECISION action

---

## See Also

- [AFI Reactor HTTP Webhook Server](../../afi-reactor/docs/HTTP_WEBHOOK_SERVER.md)
- [AFI Reactor Actions Plugin](../plugins/afi-reactor-actions/README.md)
- [AFI Client](../src/afiClient.ts)
- [Alpha Character](../src/alpha.character.ts)
- [Phoenix Character](../src/phoenix.character.ts)

