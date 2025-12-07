# AFI Eliza Demo — "Pipeline with Friends"

**Status**: Ready for ElizaOS team demo
**Date**: 2025-12-07
**Purpose**: Demonstrate AFI's signal processing pipeline using Phoenix, Alpha, Pixel Rick, Froggy, and Val Dook personas

⚠️ **DEV/DEMO ONLY** - No real trading, no AFI minting, simulated execution only.

---

## Overview

This demo showcases AFI Protocol's **Froggy trend-pullback pipeline** through a choreographed interaction between AFI personas:

### **The Cast** (in order of appearance):

1. **Phoenix** 🔥 (Host/Narrator) - Explains what's happening, provides context, runs the demo
2. **Alpha** 🔍 (Scout) - Submits trend-pullback signals to the pipeline
3. **Pixel Rick** 🧱 (Enrichment Architect) - Designs enrichment profiles, explains enrichment legos
4. **Froggy** 🐸 (Analyst) - Runs the trend_pullback_v1 strategy, computes UWR scores
5. **Val Dook** ⚖️ (Validator) - Makes approve/reject/flag decisions, explains emissions implications

### **The Pipeline** (6 stages):

1. **Alpha Scout Ingest** (Persona: Alpha) - Normalize signal payload from TradingView-like source
2. **Signal Structurer** (Persona: Pixel Rick) - Convert to USS (Universal Signal Schema)
3. **Froggy Enrichment Adapter** (Persona: Pixel Rick) - Apply enrichment legos (technical, pattern, sentiment, news, aiMl)
4. **Froggy Analyst** (Persona: Froggy) - Analyze trend-pullback setup using afi-core strategy, compute UWR score
5. **Validator Decision Evaluator** (Persona: Val Dook) - Make approve/reject/flag decision based on UWR score
6. **Execution Agent Sim** (Persona: Execution Sim) - Simulate execution (no real trading)

### **Key Insight: Enrichment Legos Economy**

**Pixel Rick's enrichment legos** are modular data feeds that enrich signals before they hit the strategy layer. Contributors can build custom enrichment packs (e.g., "Liquidity Sweep Detector", "Funding Rate Anomaly Detector") and earn AFI emissions when their legos are used in approved signals.

**Why this matters**:
- You don't need to build a full strategy to contribute to AFI
- Just build a great enrichment lego and plug it into existing strategies
- Enrichment becomes a composable, community-driven data economy

---

## Prerequisites

### 1. Services Running

You need two services running:

**AFI Reactor (backend)**:
```bash
cd /Users/secretservice/AFI_Modular_Repos/afi-reactor
npm run dev
# Should start on http://localhost:8080
```

**AFI Eliza Gateway (agent runtime)**:
```bash
cd /Users/secretservice/AFI_Modular_Repos/afi-eliza-gateway
npm run dev
# Starts ElizaOS runtime with Phoenix, Alpha, and Val Dook characters
```

### 2. Environment Variables

Set in `afi-eliza-gateway/.env`:
```bash
AFI_REACTOR_BASE_URL=http://localhost:8080
WEBHOOK_SHARED_SECRET=demo-secret-123  # Optional, for webhook auth
```

### 3. Client Interface

Choose one:
- **Discord bot** (if configured)
- **CLI** (ElizaOS terminal client)
- **Web chat** (if available)

For this demo, we'll assume **Discord** or **CLI**.

---

## Demo Script — "Pipeline with Friends"

### **ACT 1: Phoenix Introduces AFI** (2 minutes)

**User**: "Phoenix, what is AFI Protocol?"

**Phoenix** (responds):
> "AFI Protocol is Agentic Financial Intelligence—a system that processes market signals through a DAG (Directed Acyclic Graph) pipeline. Think of it as a 'financial brain' that scouts, enriches, analyzes, and validates trading setups.
> 
> I'm Phoenix, your guide to AFI. I can explain how signals flow through the system, but I don't execute trades or provide financial advice. I'm here to make AFI's intelligence accessible and understandable.
> 
> Want to see a live signal go through the pipeline?"

---

### **ACT 2: Phoenix Checks AFI Reactor Health** (30 seconds)

**User**: "Is AFI Reactor online?"

**Phoenix** (calls `CHECK_AFI_REACTOR_HEALTH`):
> "Yes, AFI Reactor is online and ready. The Froggy trend-pullback pipeline is available. We can run a demo signal through it."

---

### **ACT 3: Alpha Submits a Signal** (1 minute)

**User**: "Alpha, submit a BTC trend-pullback setup."

**Alpha** (calls `SUBMIT_FROGGY_DRAFT`):
> "BTC/USDT 1h: Bullish pullback to 20 EMA after liquidity sweep below $67.2k. Volume increasing on bounce. Structure intact (higher highs). Submitting to Froggy...
> 
> **Pipeline Result**:
> - **Decision**: approve
> - **Confidence**: 0.78 (high)
> - **Execution**: Simulated buy 0.1 BTC @ $67,500
> 
> Signal approved. Clean setup."

---

### **ACT 4: Pixel Rick Explains Enrichment Legos** (1.5 minutes)

**User**: "Pixel Rick, what are enrichment legos?"

**Pixel Rick** (calls `DESCRIBE_ENRICHMENT_LAYERS`):
> "🧱 **AFI Enrichment Legos — The Modular Data Economy**
>
> Enrichment legos are modular data feeds that enrich raw signals with context before they hit the strategy layer. Think of them as 'data plugins' that contributors can build, ship, and monetize.
>
> **5 Core Categories**:
> 1. **Technical** 🔧 - TA indicators (EMAs, RSI, MACD, volume)
> 2. **Pattern** 📊 - Chart patterns (flags, wedges, head-and-shoulders)
> 3. **Sentiment** 💬 - Social sentiment, funding rates, liquidation heatmaps
> 4. **News** 📰 - News events, macro catalysts, regulatory updates
> 5. **AI/ML** 🤖 - Ensemble hints, anomaly detection, regime classification
>
> **Why does this matter?**
> - **For Builders**: You don't need to build a full strategy. Just build a great enrichment lego and plug it into existing strategies.
> - **For Validators**: You get access to a marketplace of enrichment legos to improve signal quality.
> - **For AFI**: The enrichment layer becomes a composable, community-driven data economy.
>
> **Example**: A contributor builds a 'Liquidity Sweep Detector' enrichment lego. Validators enable it in their enrichment profile. When signals using this lego get approved, the contributor earns a share of AFI emissions.
>
> **Current Status** (AFI Eliza Demo):
> - ✅ Technical + Pattern legos are live in the Froggy pipeline
> - 🚧 Sentiment, News, AI/ML legos are in development
> - 🚧 Enrichment marketplace (monetization layer) is planned"

---

### **ACT 5: Phoenix Runs the Full AFI Eliza Demo** (2 minutes)

**User**: "Phoenix, run the AFI Eliza demo."

**Phoenix** (calls `RUN_AFI_ELIZA_DEMO`):
> "Running the AFI Eliza Demo with stage-by-stage summaries...
>
> 🏆 **AFI Eliza Demo Complete**
>
> **Signal**: BTC/USDT 1h long
> **Strategy**: froggy_trend_pullback_v1
>
> **Pipeline Flow** (Alpha → Pixel Rick → Froggy → Val Dook):
>
> 1. ✅ **Alpha** (scout): Ingested BTC/USDT long signal on 1h timeframe
>
> 2. ✅ **Pixel Rick** (structurer): Normalized signal to USS format
>
> 3. ✅ **Pixel Rick** (enrichment): Applied enrichment legos: technical, pattern
>
> 4. ✅ **Froggy** (analyst): Analyzed trend-pullback setup, UWR score: 0.78
>
> 5. ✅ **Val Dook** (validator): Decision: approve, Confidence: 0.78
>
> 6. ✅ **Execution Sim** (execution): Simulated buy
>
> ---
>
> **Final Validator Decision**:
> - **Decision**: approve
> - **Confidence**: 0.78
> - **Reason Codes**: score-high, froggy-demo
>
> **Execution** (simulated):
> - **Status**: simulated
> - **Type**: buy
> - **Asset**: BTC/USDT
> - **Amount**: 0.1
> - **Price**: $67,500
>
> ---
>
> ⚠️ **DEMO ONLY**: No real trading occurred. No AFI tokens minted.
>
> **Key Insight**: Pixel Rick's enrichment legos are modular. Contributors can build and monetize custom enrichment packs without building full strategies."

---

### **ACT 6: Phoenix Explains What Happened** (1 minute)

**User**: "Phoenix, what just happened?"

**Phoenix** (calls `EXPLAIN_LAST_FROGGY_DECISION`):
> "A signal just went through the Froggy pipeline. Here's what happened:
> 
> **Signal**: BTC/USDT 1h long (trend-pullback setup)
> 
> **Pipeline Stages**:
> 1. **Alpha Scout Ingest**: Normalized the signal payload
> 2. **Signal Structurer (Pixel Rick)**: Converted to Universal Signal Schema
> 3. **Froggy Enrichment**: Added technical indicators and pattern analysis
> 4. **Froggy Analyst**: Ran trend_pullback_v1 strategy from afi-core
> 5. **Validator (Val Dook)**: Approved with 0.78 confidence
> 6. **Execution Sim**: Simulated buy (no real trade)
> 
> **Key Point**: This is a demo. No real trading occurred, and no AFI tokens were minted. In production, approved signals would contribute to validator reputation (PoI/PoInsight scores) and potentially trigger emissions."

---

### **ACT 7: Val Dook Provides Validator Perspective** (1 minute)

**User**: "Val Dook, would this signal qualify for emissions?"

**Val Dook** (uses `EXPLAIN_LAST_FROGGY_DECISION` with validator lens):
> "The validator decision is: **approve**. Confidence: **0.78** (high confidence range).
>
> **Reasoning**:
> - **Signal Quality**: High. Trend confirmed, volume supports the move, structure is clean.
> - **Confidence**: 0.78 is above the approval threshold (0.6). This signal passes the bar.
> - **Emissions Implications**: Once minting is live, this would qualify for AFI emissions. The signal quality is consistent with protocol standards.
> - **Reputational Risk**: Medium. If this signal fails, it's not catastrophic, but we'd review the setup.
> - **Verdict**: Approve. This signal demonstrates the quality bar we expect for emissions-eligible signals.
>
> **What would improve it?**
> - Higher volume confirmation (currently 'ok', could be 'strong')
> - Additional pattern confluence (e.g., bull flag breakout)
>
> Remember: The bar is high. We don't approve marginal setups."

---

## Demo Choreography Summary

| **Persona** | **Role** | **Action** | **Narrative Voice** |
|-------------|----------|------------|---------------------|
| **Phoenix** | Host/Narrator | `CHECK_AFI_REACTOR_HEALTH`, `RUN_AFI_ELIZA_DEMO`, `EXPLAIN_LAST_FROGGY_DECISION` | Warm, educational, context-provider |
| **Alpha** | Scout | `SUBMIT_FROGGY_DRAFT` | Brief, technical, setup-focused |
| **Pixel Rick** | Enrichment Architect | `DESCRIBE_ENRICHMENT_LAYERS` | Sarcastic, sharp, technical, helpful |
| **Froggy** | Analyst | (runs in pipeline, no direct action) | Analytical, strategy-focused |
| **Val Dook** | Validator | `EXPLAIN_LAST_FROGGY_DECISION` (validator lens) | Serious, emissions-aware, quality-focused |

---

## Safety & Disclaimers

All personas follow **AFI_AGENT_PLAYBOOK.v0.1.md** and **AFI_AGENT_SAFETY_CHECKLIST.v0.1.md**:

✅ **AFI is the source of truth** - All data comes from afi-reactor APIs  
✅ **No financial advice** - Personas provide intelligence, not trade recommendations  
✅ **Clear disclaimers** - "This is a demo. No real trading. No emissions."  
✅ **Separate facts from interpretation** - Phoenix/Val Dook clearly mark AFI data vs commentary  
✅ **No secrets, no keys** - Agents never request private keys or credentials  

---

## Next Steps After Demo

1. **Show the code**: Walk through `afi-reactor/src/services/froggyDemoService.ts` to show the 6-stage pipeline
2. **Show the DAG**: Display `afi-reactor/config/dag.codex.json` to visualize node connections
3. **Explain governance**: Reference `AFI_ORCHESTRATOR_DOCTRINE.md` (10 Commandments)
4. **Discuss future**: Mention PoI/PoInsight scoring, emissions, and validator reputation

---

**End of Demo Script**

**Total Time**: ~5-6 minutes  
**Audience**: ElizaOS team  
**Goal**: Show AFI's signal pipeline with clear persona roles and safety boundaries

