# AFI Eliza Demo CLI — Technical Notes

**Status**: Implemented  
**Date**: 2025-12-07  
**Purpose**: Document the AFI CLI command namespace inside the Eliza CLI

---

## Overview

The AFI Eliza Demo CLI provides an AFI command namespace inside the Eliza CLI. Users can invoke AFI-specific commands directly from the CLI prompt without needing to phrase them as natural language queries.

**Key Features**:
- ✅ AFI command namespace (`/afi <subcommand>`)
- ✅ Direct access to AFI Reactor endpoints
- ✅ Human-readable summaries
- ✅ Phoenix can also front the same flows via natural language
- ✅ No duplicate logic (shared helpers)

---

## AFI Command List

### 1. `/afi eliza-demo`

**Purpose**: Run the AFI Eliza Demo pipeline

**What it does**:
- Calls `POST /demo/afi-eliza-demo` on AFI Reactor
- Returns a narrative summary with:
  - Signal details (symbol, timeframe, direction, strategy)
  - Stage-by-stage pipeline progression (Alpha → Pixel Rick → Froggy → Val Dook)
  - Validator decision (approve/reject/flag + confidence)
  - Simulated execution details

**Example**:
```
AFI> /afi eliza-demo

🎯 **AFI Eliza Demo Complete**

**Signal**: BTC/USDT 1h long
**Strategy**: froggy_trend_pullback_v1

**Pipeline Flow**:
1. ✅ Alpha (scout): Alpha Scout ingested TradingView-like signal...
2. ✅ Pixel Rick (structurer): Pixel Rick normalized signal to USS...
3. ✅ Pixel Rick (enrichment): Pixel Rick applied enrichment legos...
   Enrichment: technical, pattern
4. ✅ Froggy (analyst): Froggy analyzed trend-pullback setup...
   UWR Score: 0.75
5. ✅ Val Dook (validator): Val Dook approved signal...
   Decision: approve
6. ✅ Execution Sim (execution): Execution Sim simulated BUY...

---

**Final Decision**: approve (confidence: 0.78)
**Execution**: simulated - buy 0.1 BTC/USDT @ 67500

⚠️ **DEMO ONLY**: No real trading. No AFI tokens minted.
```

---

### 2. `/afi reactor status`

**Purpose**: Check AFI Reactor health

**What it does**:
- Calls `GET /health` on AFI Reactor
- Returns service status and Froggy pipeline availability

**Example**:
```
AFI> /afi reactor status

✅ **AFI Reactor is online**

Service: afi-reactor
Froggy Pipeline: available
```

---

### 3. `/afi validator explain-last`

**Purpose**: Explain the last validator decision

**What it does**:
- Retrieves the last Froggy decision from in-memory cache
- Returns validator decision details and reasoning

**Current Status**: ⚠️ Not yet fully implemented (requires persistent storage)

**Example**:
```
AFI> /afi validator explain-last

⚠️ **Last Validator Decision**: Not yet implemented.

This feature requires persistent storage of pipeline results. Currently, decisions are only cached in-memory during the session.
```

---

### 4. `/afi help`

**Purpose**: Show AFI CLI help

**Example**:
```
AFI> /afi help

**AFI Command Usage**:

  /afi eliza-demo           Run the AFI Eliza Demo pipeline
  /afi reactor status       Check AFI Reactor health
  /afi validator explain-last  Explain the last validator decision (if available)
  /afi help                 Show this help message

**Note**: Phoenix can also run these flows via natural language.
```

---

## How It Maps to AFI Reactor Endpoints

| AFI CLI Command | AFI Reactor Endpoint | Method | Description |
|-----------------|---------------------|--------|-------------|
| `/afi eliza-demo` | `/demo/afi-eliza-demo` | POST | Run pre-configured demo signal through Froggy pipeline |
| `/afi reactor status` | `/health` | GET | Check AFI Reactor health and availability |
| `/afi validator explain-last` | N/A (in-memory cache) | N/A | Retrieve last validator decision (future: persistent storage) |

---

## How Phoenix Fronts the Same Flows

Phoenix can trigger the same AFI flows via natural language using the AFI Reactor Actions Plugin.

**Phoenix Actions** (from `afi-reactor-actions` plugin):
- `RUN_AFI_ELIZA_DEMO` - Run the AFI Eliza Demo
- `CHECK_AFI_REACTOR_HEALTH` - Check AFI Reactor status
- `EXPLAIN_LAST_FROGGY_DECISION` - Explain last decision

**Example Natural Language Interactions**:

1. **Run AFI Eliza Demo**:
   ```
   User: "Run the AFI Eliza demo"
   Phoenix: [calls RUN_AFI_ELIZA_DEMO action]
            "Running the AFI Eliza Demo... [narrative summary]"
   ```

2. **Check AFI Reactor Status**:
   ```
   User: "Is AFI Reactor online?"
   Phoenix: [calls CHECK_AFI_REACTOR_HEALTH action]
            "Yes, AFI Reactor is online and ready."
   ```

3. **Explain Last Decision**:
   ```
   User: "Explain the last AFI decision"
   Phoenix: [calls EXPLAIN_LAST_FROGGY_DECISION action]
            "The last signal was BTC/USDT 1h long. Froggy approved it..."
   ```

**Shared Logic**:
- Both the AFI CLI and Phoenix use the same underlying functions from `src/afiClient.ts`
- No duplicate logic: `runFroggyTrendPullback()`, `checkAfiReactorHealth()`, etc. are shared
- Phoenix actions wrap these functions with LLM-friendly narratives

---

## Architecture

```
┌─────────────────────────────────────┐
│  User Input                         │
│  - CLI: "/afi eliza-demo"           │
│  - Phoenix: "Run the AFI demo"      │
└──────────────┬──────────────────────┘
               │
               ├─────────────────────────────────┐
               │                                 │
               ▼                                 ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│  AFI CLI Handler            │   │  Phoenix Actions            │
│  (src/afiCli.ts)            │   │  (plugins/afi-reactor-      │
│                             │   │   actions/index.ts)         │
└──────────────┬──────────────┘   └──────────────┬──────────────┘
               │                                 │
               └─────────────┬───────────────────┘
                             │
                             ▼
               ┌─────────────────────────────┐
               │  Shared AFI Client          │
               │  (src/afiClient.ts)         │
               │  - runFroggyTrendPullback() │
               │  - checkAfiReactorHealth()  │
               └──────────────┬──────────────┘
                              │
                              │ HTTP
                              ▼
               ┌─────────────────────────────┐
               │  AFI Reactor                │
               │  - POST /demo/afi-eliza-demo│
               │  - GET /health              │
               └─────────────────────────────┘
```

---

## Limitations and Assumptions

### DEMO-ONLY ⚠️

This CLI is for **development and demo purposes only**. It is NOT for production use.

**What This CLI Does NOT Do**:
- ❌ No real trading or exchange API calls
- ❌ No AFI token minting or emissions
- ❌ No persistent storage of decisions (in-memory cache only)
- ❌ No authentication (assumes local AFI Reactor)
- ❌ No rate limiting or production-grade error handling

**Assumptions**:
- AFI Reactor is running locally on `http://localhost:8080` (or `AFI_REACTOR_BASE_URL` env var)
- All execution is simulated
- UWR scores are computed using real afi-core math, but no emissions occur
- Enrichment data is mocked (no real market data feeds)
- Validator decisions are deterministic in demo mode

---

## Environment Variables

**Required**:
```bash
OPENAI_API_KEY=sk-...  # For Phoenix LLM (if using Phoenix)
```

**Optional**:
```bash
AFI_REACTOR_BASE_URL=http://localhost:8080  # AFI Reactor URL (default: http://localhost:8080)
WEBHOOK_SHARED_SECRET=demo-secret-123       # Optional shared secret for webhook auth
```

---

## Running the AFI CLI

### 1. Start AFI Reactor

```bash
cd /Users/secretservice/AFI_Modular_Repos/afi-reactor
npm run dev
```

### 2. Start AFI Eliza Gateway

```bash
cd /Users/secretservice/AFI_Modular_Repos/afi-eliza-gateway
npm run dev
```

### 3. Use AFI Commands

```
AFI> /afi eliza-demo
AFI> /afi reactor status
AFI> /afi help
```

---

## Future Enhancements

**Planned**:
- [ ] Persistent storage for validator decisions (database or file-based)
- [ ] `/afi validator explain-last` full implementation
- [ ] `/afi signal submit <symbol> <timeframe> <direction>` - Submit custom signals
- [ ] `/afi enrichment list` - List available enrichment legos
- [ ] `/afi validator stats` - Show validator performance stats
- [ ] Authentication and rate limiting for production use

---

**End of AFI Eliza Demo CLI Notes**

