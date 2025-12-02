# Offline Telemetry Quickstart

**How to run the offline AFI telemetry smoke test**

This document explains how to test the AFI telemetry plugin in offline mode without requiring OpenAI, AFI APIs, or Discord.

---

## Purpose

The offline telemetry smoke test verifies that the `@afi/plugin-afi-telemetry` plugin works correctly in offline mode. It:

- Tests all three plugin actions (GET_MARKET_SUMMARY, GET_VALIDATOR_SNAPSHOT, GET_RECENT_SIGNAL_HIGHLIGHTS)
- Validates that mock data is returned in the correct format
- Ensures type safety and contract compliance
- Requires NO network access, NO API keys, NO external services

**What it does NOT do**:
- Call OpenAI APIs
- Call AFI APIs (afi-reactor, afi-core)
- Start Discord client
- Make any network requests

---

## Prerequisites

**Required**:
- Node.js (v18 or later)
- npm (v9 or later)

**Setup**:
1. Clone the afi-eliza-gateway repository
2. Install dependencies:

```bash
cd afi-eliza-gateway
npm install
```

That's it. No environment variables, no API keys, no configuration needed.

---

## Running the Smoke Test

From the `afi-eliza-gateway` directory, run:

```bash
npm run telemetry:offline
```

**Expected output**:

```
╔════════════════════════════════════════════════════════════╗
║  AFI Telemetry Plugin - Offline Smoke Test                ║
╚════════════════════════════════════════════════════════════╝

📋 Testing AFI telemetry plugin actions in offline mode...
   (No OpenAI, no AFI APIs, no Discord, no network calls)

🔧 Initializing plugin...
[WARN] ⚠️  AFI Telemetry Plugin: Running in OFFLINE MODE (mock data only). Set AFI_REACTOR_URL and AFI_CORE_URL to enable live data.

✅ Found 3 actions in plugin

═══════════════════════════════════════════════════════════
📊 Action: GET_MARKET_SUMMARY
───────────────────────────────────────────────────────────
Description: Retrieve aggregated market regime and cross-asset context from AFI Protocol...

✅ Result:
{
  success: true,
  data: {
    timestamp: '2025-11-28T20:30:00.000Z',
    regime: 'transition',
    riskTier: 'medium',
    assets: [
      { symbol: 'BTC', sentiment: 'neutral', volatility: 'medium' },
      { symbol: 'ETH', sentiment: 'neutral', volatility: 'medium' }
    ],
    summary: 'Mock data: AFI telemetry plugin is in offline mode...'
  }
}

═══════════════════════════════════════════════════════════
📊 Action: GET_VALIDATOR_SNAPSHOT
───────────────────────────────────────────────────────────
Description: Retrieve aggregated validator activity and consensus metrics...

✅ Result:
{
  success: true,
  data: {
    timestamp: '2025-11-28T20:30:00.000Z',
    activeValidators: 12,
    consensusLevel: 'moderate',
    topDomains: [ 'crypto', 'macro', 'defi' ],
    summary: 'Mock data: 12 active validators with moderate consensus...'
  }
}

═══════════════════════════════════════════════════════════
📊 Action: GET_RECENT_SIGNAL_HIGHLIGHTS
───────────────────────────────────────────────────────────
Description: Retrieve recent high-confidence signal highlights...

✅ Result:
{
  success: true,
  data: {
    timestamp: '2025-11-28T20:30:00.000Z',
    highlights: [
      {
        asset: 'BTC',
        pattern: 'consolidation',
        confidence: 'medium',
        description: 'BTC showing consolidation pattern near key support level'
      },
      {
        asset: 'ETH',
        pattern: 'divergence',
        confidence: 'low',
        description: 'ETH price-volume divergence detected, monitoring for confirmation'
      }
    ],
    summary: 'Mock data: 2 signal highlights detected...'
  }
}

═══════════════════════════════════════════════════════════

✅ All actions tested successfully!
✅ Offline telemetry smoke test PASSED
```

---

## Relationship to Phoenix

Phoenix (AFI's frontline agent) uses `@afi/plugin-afi-telemetry` in real conversations to answer questions like:
- "What is AFI seeing on BTC right now?"
- "How are AFI validators doing?"
- "What signals is AFI highlighting?"

The smoke test hits the **same actions** that Phoenix would invoke, just outside of the full ElizaOS runtime. This allows you to:
- Verify the AFI telemetry contract before wiring real AFI endpoints
- Test plugin behavior without starting the full Phoenix runtime
- Develop and debug plugin logic in isolation

**In production**, Phoenix would:
1. Receive a user message via Discord (or other client)
2. Invoke one of the telemetry actions (e.g. GET_MARKET_SUMMARY)
3. Receive the action result (market summary data)
4. Use the data to compose a response to the user

**In the smoke test**, we:
1. Create a fake runtime and message
2. Invoke the same telemetry actions directly
3. Validate the action results
4. Log the results to the console

---

## Future: Live Mode

When AFI endpoints are available (afi-reactor, afi-core), the plugin will switch to "live mode" and call real AFI APIs.

**To enable live mode**:

1. Set environment variables:

```bash
export AFI_REACTOR_URL="http://localhost:3001"  # or production URL
export AFI_CORE_URL="http://localhost:3002"     # or production URL
```

2. Run the smoke test again:

```bash
npm run telemetry:offline
```

The plugin will detect the environment variables and switch to live mode automatically. The smoke test will then:
- Call real AFI HTTP endpoints
- Return real aggregated data (not mock data)
- Still remain safe and read-only (no writes, no mutations)

**Safety guarantees** (live mode):
- Read-only access only (no writes to AFI databases)
- Aggregated views only (no raw data, no sensitive internals)
- No financial advice (intelligence, not recommendations)
- No wallet addresses or private identifiers

---

## Troubleshooting

**Error: "Cannot find module '@elizaos/core'"**
- Run `npm install` to install dependencies

**Error: "No actions found in plugin!"**
- Check that `plugins/afi-telemetry/index.ts` exports `afiTelemetryPlugin` with an `actions` array

**Error: "Result missing 'success' field!"**
- Check that action handlers return `{ success: boolean, data?: any, error?: string }`

**Script runs but shows no output**
- Check that you're running `npm run telemetry:offline` (not `npm run telemetry`)
- Check that `scripts/offline-telemetry-smoke.ts` exists

---

## Next Steps

**For developers**:
1. Review the plugin implementation: `plugins/afi-telemetry/index.ts`
2. Review the plugin types: `plugins/afi-telemetry/types.ts`
3. Review the plugin README: `plugins/afi-telemetry/README.md`

**For AFI service developers**:
1. Implement AFI HTTP endpoints (afi-reactor, afi-core)
2. Update plugin to call real endpoints (replace mock data)
3. Test with live mode enabled (set AFI_REACTOR_URL, AFI_CORE_URL)

**For Phoenix developers**:
1. Test Phoenix conversations that invoke telemetry actions
2. Verify that Phoenix uses telemetry data correctly in responses
3. Add more message examples to `src/phoenix.character.ts`

---

**Version**: 0.1.0 (offline mode)  
**Status**: Smoke test only, mock data  
**Maintainers**: AFI Protocol Team

