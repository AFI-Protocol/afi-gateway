# ElizaOS Web Client Demo Runbook

**Purpose**: Step-by-step guide to run the AFI "Pipeline with Friends" demo using ElizaOS's web client  
**Audience**: ElizaOS team, demo presenters  
**Duration**: 10-15 minutes  
**Status**: Ready for demo

---

## Prerequisites

### 1. Services Required

- **afi-reactor** (local or deployed) — AFI signal processing backend
- **afi-eliza-gateway** (Render or local) — AFI personas + actions
- **ElizaOS web client** (or CLI) — User interface

### 2. Environment Variables

**afi-eliza-gateway** requires:
```bash
# Required
OPENAI_API_KEY=sk-...                    # For LLM (Phoenix, Alpha, etc.)
AFI_REACTOR_BASE_URL=http://localhost:8080  # AFI Reactor endpoint

# Optional
MONGODB_URI=mongodb+srv://...            # For session/message history
NODE_ENV=development
```

**afi-reactor** requires:
```bash
# Optional
AFI_REACTOR_PORT=8080                    # Server port (default: 8080)
WEBHOOK_SHARED_SECRET=demo-secret-123    # Optional webhook auth
```

---

## Quick Start (Local Development)

### Step 1: Start AFI Reactor

```bash
cd /Users/secretservice/AFI_Modular_Repos/afi-reactor
npm run dev
```

**Expected output**:
```
🚀 AFI REACTOR — DEMO SERVER
   Listening on http://localhost:8080
   Available Routes:
     GET  /health
     POST /api/webhooks/tradingview
     POST /demo/prize-froggy
```

**Verify**:
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok","service":"afi-reactor",...}
```

### Step 2: Start AFI Eliza Gateway (CLI Mode)

```bash
cd /Users/secretservice/AFI_Modular_Repos/afi-eliza-gateway
npm run dev
```

**Expected output**:
```
🚀 Starting AFI Eliza Gateway...
✅ AFI Reactor Actions Plugin registered
💬 Starting AFI CLI interface...
   Type '/afi help' for AFI commands
AFI> 
```

**Test AFI CLI**:
```
AFI> /afi reactor status
AFI> /afi eliza-demo
```

### Step 3: Connect ElizaOS Web Client

**Option A: Use ElizaOS's official web client**

1. Clone ElizaOS (if not already):
   ```bash
   cd /Users/secretservice/AFI_Modular_Repos/ElizaOS_Ext_Ref/eliza
   ```

2. Configure ElizaOS to use AFI characters:
   ```bash
   # TODO: Add ElizaOS web client configuration steps
   # This depends on ElizaOS's official web client setup
   ```

**Option B: Use Discord client** (if configured):
```bash
# Set Discord credentials in .env:
DISCORD_APPLICATION_ID=your_app_id
DISCORD_API_TOKEN=your_bot_token

# Restart afi-eliza-gateway
npm run dev
```

**Option C: Use CLI only** (for quick testing):
```bash
# Already running from Step 2
AFI> /afi help
```

---

## Demo Script — "Pipeline with Friends"

### Act 1: Phoenix Introduction (2 min)

**User**: "Phoenix, what is AFI Protocol?"

**Expected**: Phoenix explains AFI architecture, signal pipeline, personas

### Act 2: Health Check (30 sec)

**User**: "Is AFI Reactor online?"

**Expected**: Phoenix calls `CHECK_AFI_REACTOR_HEALTH` action, confirms reactor is ready

### Act 3: Run Full Demo (3 min)

**User**: "Run the AFI Eliza demo"

**Expected**: Phoenix calls `RUN_AFI_ELIZA_DEMO` action, shows stage-by-stage pipeline results

### Act 4: Explain Decision (2 min)

**User**: "Explain the last Froggy decision"

**Expected**: Phoenix calls `EXPLAIN_LAST_FROGGY_DECISION`, breaks down validator decision

### Act 5: Enrichment Legos (2 min)

**User**: "Pixel Rick, what are enrichment legos?"

**Expected**: Pixel Rick calls `DESCRIBE_ENRICHMENT_LAYERS`, explains modular data economy

---

## Production Deployment (Render)

### afi-eliza-gateway on Render

**URL**: https://afi-eliza-gateway.onrender.com

**Status**: ✅ LIVE

**Endpoints**:
- `GET /` — Service info
- `GET /healthz` — Health check
- `GET /demo/ping` — Ping

**Environment Variables** (set in Render dashboard):
```
OPENAI_API_KEY=sk-...
AFI_REACTOR_BASE_URL=http://localhost:8080  # Or deployed reactor URL
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

**Note**: Render deployment runs `npm run build && npm start`, which starts the HTTP server (not CLI).

---

## Troubleshooting

### Issue: "AFI Reactor is offline"

**Solution**:
1. Check `AFI_REACTOR_BASE_URL` in `.env`
2. Verify afi-reactor is running: `curl http://localhost:8080/health`
3. Check firewall/network if using remote reactor

### Issue: "OPENAI_API_KEY not set"

**Solution**:
1. Copy `.env.example` to `.env`
2. Add your OpenAI API key
3. Restart afi-eliza-gateway

### Issue: "MongoDB connection failed"

**Solution**:
1. MongoDB is optional for demo
2. If needed, set `MONGODB_URI` in `.env`
3. Use MongoDB Atlas connection string

---

## Next Steps

- [ ] Configure ElizaOS web client to load AFI characters
- [ ] Test multi-agent runtime (Phoenix, Alpha, Froggy, Pixel Rick, Val Dook)
- [ ] Deploy afi-reactor to cloud (for production demo)
- [ ] Add WebSocket support for real-time updates (future)

---

**End of Runbook**

