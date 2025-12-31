# ElizaOS Web Client Integration Guide

**Purpose**: Complete guide to integrate AFI personas with the ElizaOS web client  
**Status**: Ready for implementation  
**Date**: 2025-12-08

---

## Architecture Overview

### Current State

1. **AFI Web Client** (`ElizaOS_Ext_Ref/eliza/packages/client-afi`)
   - ✅ Already exists (forked from ElizaOS web client)
   - ✅ AFI-branded (logo, title, theme)
   - ✅ Configured to connect to `VITE_AFI_SERVER_URL`
   - ✅ Uses `@elizaos/api-client` to communicate with server

2. **AFI Eliza Gateway** (`afi-eliza-gateway`)
   - ✅ AFI personas defined (Phoenix, Alpha, Froggy, Pixel Rick, Val Dook)
   - ✅ AFI Reactor Actions Plugin working
   - ⚠️ **MISSING**: Full ElizaOS server API (agents, messaging, rooms)
   - ⚠️ **CURRENT**: Minimal HTTP server (health checks only)

3. **Gap**: The web client expects a full ElizaOS server with:
   - `GET /agents` - List all agents
   - `POST /agents/:agentId/message` - Send message to agent
   - `GET /agents/:agentId/rooms` - List agent rooms
   - WebSocket support for real-time updates

---

## Solution: Use ElizaOS Server Package

Instead of building a custom server, we should use `@elizaos/server` package which provides all the necessary APIs.

### Option A: Integrate ElizaOS Server into afi-eliza-gateway (RECOMMENDED)

**Pros**:
- Full ElizaOS server API out of the box
- WebSocket support for real-time chat
- Multi-agent runtime built-in
- Minimal code changes

**Cons**:
- Adds dependency on `@elizaos/server`
- Slightly heavier than current minimal server

### Option B: Build Custom API Endpoints (NOT RECOMMENDED)

**Pros**:
- Full control over API surface
- Lighter weight

**Cons**:
- Requires implementing all ElizaOS server APIs manually
- High maintenance burden
- Risk of incompatibility with web client

**Decision**: Use Option A (integrate `@elizaos/server`)

---

## Implementation Plan

### Step 1: Add ElizaOS Server Dependency ✅ DONE

```bash
cd afi-eliza-gateway
npm install @elizaos/server dotenv
```

**Status**: ✅ Added to `package.json`:
- `@elizaos/server`: `1.6.4`
- `dotenv`: `^16.4.7`

### Step 2: Create New Server Entrypoint ✅ DONE

**File**: `src/server-full.ts`

**Status**: ✅ Created with full ElizaOS server integration:
- Multi-agent runtime (all 5 AFI personas)
- AFI Reactor Actions Plugin wired to all agents
- REST API endpoints (`/api/agents`, `/api/agents/:id/message`, etc.)
- WebSocket support for real-time chat
- Graceful shutdown handlers
- Environment variable validation

### Step 3: Update package.json Scripts ✅ DONE

**Status**: ✅ Updated scripts:
```json
{
  "scripts": {
    "dev": "tsx src/index.ts",                    // CLI mode (unchanged)
    "dev:server": "tsx src/server.ts",            // Minimal HTTP server (unchanged)
    "dev:server-full": "tsx src/server-full.ts",  // NEW: Full ElizaOS server
    "build": "tsc",
    "start": "node dist/src/server-full.js",      // UPDATED: Production uses full server
    "start:minimal": "node dist/src/server.js",   // NEW: Minimal server (backup)
    "start:cli": "node dist/src/index.js"         // CLI mode (unchanged)
  }
}
```

### Step 4: Configure AFI Web Client ✅ READY

**Location**: `ElizaOS_Ext_Ref/eliza/packages/client-afi`

**Status**: ✅ Already configured (no changes needed)

The AFI web client is already set up to read `VITE_AFI_SERVER_URL` from environment variables.

**To configure** (first time only):
```bash
cd ElizaOS_Ext_Ref/eliza/packages/client-afi
cp .env.example .env.local
```

Edit `.env.local`:
```bash
VITE_AFI_SERVER_URL=http://localhost:3000
VITE_AFI_DEFAULT_CHARACTER_ID=phoenix
```

### Step 5: Start Services ✅ READY TO TEST

**Terminal 1: AFI Reactor**
```bash
cd afi-reactor
npm run dev
# Runs on http://localhost:8080
```

**Terminal 2: AFI Eliza Gateway (Full Server)**
```bash
cd afi-eliza-gateway
npm install  # First time only (installs @elizaos/server)
npm run dev:server-full
# Runs on http://localhost:3000
```

**Terminal 3: AFI Web Client**
```bash
cd ElizaOS_Ext_Ref/eliza
bun run dev:afi-web
# Opens on http://localhost:5173
```

**Terminal 4: Open Browser**
```
http://localhost:5173
```

**Expected Result**:
- AFI-branded web interface
- List of 5 agents (Phoenix, Alpha, Froggy, Pixel Rick, Val Dook)
- Ability to chat with each agent
- Real-time responses via WebSocket

---

## Implementation Status

### ✅ COMPLETED

1. ✅ Added `@elizaos/server` dependency to `package.json`
2. ✅ Created `src/server-full.ts` with full ElizaOS server
3. ✅ Updated `package.json` scripts
4. ✅ Wired all 5 AFI personas (Phoenix, Alpha, Froggy, Pixel Rick, Val Dook)
5. ✅ Integrated AFI Reactor Actions Plugin
6. ✅ Added environment variable validation
7. ✅ Added graceful shutdown handlers

### 🔄 READY TO TEST

1. 🔄 Install dependencies (`npm install`)
2. 🔄 Start full server (`npm run dev:server-full`)
3. 🔄 Test multi-agent runtime
4. 🔄 Verify web client integration
5. 🔄 Run "Pipeline with Friends" demo

### 📋 NEXT STEPS

1. **Install Dependencies** (first time only):
   ```bash
   cd afi-eliza-gateway
   npm install
   ```

2. **Test Locally**:
   ```bash
   # Terminal 1: AFI Reactor
   cd afi-reactor
   npm run dev

   # Terminal 2: AFI Eliza Gateway (Full Server)
   cd afi-eliza-gateway
   npm run dev:server-full

   # Terminal 3: AFI Web Client
   cd ElizaOS_Ext_Ref/eliza
   bun run dev:afi-web
   ```

3. **Verify**:
   - Open `http://localhost:5173`
   - Check that all 5 agents appear
   - Test chat with each agent
   - Run demo pipeline

4. **Deploy to Render**:
   - Update `start` script (already done)
   - Push to GitHub
   - Render will auto-deploy with full server

---

## Troubleshooting

### Issue: `@elizaos/server` not found

**Solution**: Run `npm install` to install dependencies.

### Issue: Port 3000 already in use

**Solution**: Set `PORT` environment variable:
```bash
PORT=3001 npm run dev:server-full
```

### Issue: Web client can't connect

**Solution**: Check `VITE_AFI_SERVER_URL` in `.env.local`:
```bash
# Should match the port where server-full is running
VITE_AFI_SERVER_URL=http://localhost:3000
```

### Issue: Agents not appearing in web client

**Solution**: Check server logs for agent startup errors. Verify all 5 characters are loaded.

---

**End of Integration Guide**

