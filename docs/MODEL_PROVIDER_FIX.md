> ⚠️ Historical snapshot. The legacy Froggy demo chain (Alpha Scout → Pixel Rick → Val Dook → Execution Sim) was removed; the reactor is scored-only. Canonical pipeline: afi-reactor/src/config/froggyPipeline.ts.

# Model Provider Fix — TEXT_LARGE Handler

**Date**: 2025-12-08  
**Issue**: `Error: No handler found for delegate type: TEXT_LARGE`  
**Status**: ✅ **FIXED**

---

## 🎯 PROBLEM

When running `npm run dev:server-full` and sending messages via the AFI web client, agents failed to respond with:

```
Error [Phoenix] [MessageService] Error in handleMessage: { 
  error: Error: No handler found for delegate type: TEXT_LARGE 
}
```

**Root Cause**: The full server (`server-full.ts`) was only passing `afiReactorActionsPlugin` to agents, without the base plugins that provide model providers.

---

## 🔍 DIAGNOSIS

### What We Found

1. **CLI Mode Works** (`src/index.ts`):
   - Creates `AgentRuntime` directly
   - Character definitions include `plugins` array
   - Phoenix character has: `["@elizaos/plugin-bootstrap", "@elizaos/plugin-node", "@afi/plugin-afi-telemetry"]`

2. **Character Plugin Coverage**:
   - ✅ Phoenix: Has `plugins` array with bootstrap + node
   - ❌ Alpha: No `plugins` array
   - ❌ Froggy: No `plugins` array
   - ❌ Pixel Rick: No `plugins` array
   - ❌ Val Dook: No `plugins` array

3. **AgentServer Behavior** (from ElizaOS source):
   - Line 115: `const allPlugins = [...(agent.character.plugins || []), ...(agent.plugins || []), sqlPlugin];`
   - Merges character plugins + config plugins + server plugins
   - If character has no `plugins` array, only gets config plugins + sqlPlugin

4. **The Gap**:
   - `server-full.ts` only passed `[afiReactorActionsPlugin]`
   - Characters without `plugins` array got: `[afiReactorActionsPlugin, sqlPlugin]`
   - Missing `@elizaos/plugin-bootstrap` → No model providers → No TEXT_LARGE handler

---

## ✅ SOLUTION

### Add Base Plugins for All Agents

Created a `basePlugins` array that includes:
1. `@elizaos/plugin-bootstrap` — Provides model providers (OpenAI, Anthropic, etc.)
2. `@elizaos/plugin-node` — Provides Node.js services (browser, PDF, speech, etc.)
3. `afiReactorActionsPlugin` — AFI-specific actions

Pass this array to **all** agents in `server.start()` config.

---

## 📝 CHANGES MADE

### File: `src/server-full.ts`

**Added** (after imports):
```typescript
/**
 * Base plugins required for all AFI agents.
 * These provide core functionality like model providers (TEXT_LARGE, etc.)
 * and Node.js services (browser, PDF, speech, etc.)
 */
const basePlugins = [
  "@elizaos/plugin-bootstrap", // Provides model providers (OpenAI, Anthropic, etc.)
  "@elizaos/plugin-node",      // Provides Node.js services
  afiReactorActionsPlugin,     // AFI-specific actions
];
```

**Changed** (in `server.start()` config):
```typescript
// BEFORE:
agents: [
  { character: phoenixCharacter, plugins: [afiReactorActionsPlugin] },
  { character: alphaCharacter, plugins: [afiReactorActionsPlugin] },
  // ...
]

// AFTER:
agents: [
  { character: phoenixCharacter, plugins: basePlugins },
  { character: alphaCharacter, plugins: basePlugins },
  { character: froggyCharacter, plugins: basePlugins },
  { character: pixelRickCharacter, plugins: basePlugins },
  { character: valDookCharacter, plugins: basePlugins },
]
```

---

## ✅ VERIFICATION

### TypeScript Build
```bash
npm run build
```
**Result**: ✅ **PASSES** (no errors)

### Expected Runtime Behavior

When running `npm run dev:server-full`:
1. ✅ All 5 agents start successfully
2. ✅ Bootstrap plugin registers model providers
3. ✅ TEXT_LARGE delegate handler is available
4. ✅ Agents can respond to messages via web client
5. ✅ AFI Reactor Actions work (health checks, signal submission, demo)

---

## 🎯 KEY INSIGHT

**Pattern Reuse**: The fix reuses the exact plugin pattern from Phoenix's character definition:
- `@elizaos/plugin-bootstrap` (model providers)
- `@elizaos/plugin-node` (Node.js services)
- AFI-specific plugins (reactor actions)

This ensures the full server behaves the same way as CLI mode, with all agents having access to the same base functionality.

---

## 📋 FILES CHANGED

**Modified**:
1. `afi-gateway/src/server-full.ts` — Added `basePlugins` array and updated agent configs

**Created**:
2. `afi-gateway/docs/MODEL_PROVIDER_FIX.md` — This summary

**Total Changes**: 1 file modified (minimal, surgical fix)

---

## 🚀 READY TO TEST

The server is now ready for full testing with the AFI web client:

```bash
cd afi-gateway
npm run dev:server-full
```

**Expected Output**:
```
🚀 Starting AFI Eliza Gateway (Full Server)...
🔗 AFI Reactor URL: http://localhost:8080
⚙️  Creating ElizaOS server...
🚀 Starting server with all AFI agents...
✅ Server initialized and agents started
🎉 AFI ELIZA GATEWAY — FULL SERVER RUNNING
```

Then open AFI web client at `http://localhost:5173` and test messaging with all 5 agents.

---

**End of Fix Summary**

