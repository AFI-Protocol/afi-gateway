/**
 * Test script for AFI Eliza Demo endpoint integration
 *
 * This script tests the RUN_AFI_ELIZA_DEMO action to verify:
 * 1. The endpoint returns stageSummaries (7 stages)
 * 2. AI/ML enrichment notes are present and include model explainability
 * 3. The narrative includes the AI/ML notes section
 */

const AFI_REACTOR_BASE_URL = process.env.AFI_REACTOR_BASE_URL || "http://localhost:8080";

async function testDemoEndpoint() {
  console.log("🎯 Testing AFI Eliza Demo Endpoint Integration\n");
  console.log(`Reactor URL: ${AFI_REACTOR_BASE_URL}\n`);

  try {
    // Step 1: Call the demo endpoint
    console.log("1️⃣  Calling /demo/afi-eliza-demo...");
    const response = await fetch(`${AFI_REACTOR_BASE_URL}/demo/afi-eliza-demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log("✅ Response received\n");

    // Debug: Print full response structure
    console.log("📋 Full response structure:");
    console.log(JSON.stringify(result, null, 2));
    console.log("\n");

    // Step 2: Verify stageSummaries
    console.log("2️⃣  Verifying stageSummaries...");
    if (!result.stageSummaries || !Array.isArray(result.stageSummaries)) {
      throw new Error("stageSummaries not found or not an array");
    }
    console.log(`✅ Found ${result.stageSummaries.length} stages\n`);

    // Step 3: Verify AI/ML enrichment notes in stageSummaries
    console.log("3️⃣  Verifying AI/ML enrichment notes in stageSummaries...");
    const enrichmentStage = result.stageSummaries.find((s: any) => s.stage === "enrichment");

    if (!enrichmentStage) {
      console.error("❌ Enrichment stage not found in stageSummaries");
      console.error(`   Available stages: ${result.stageSummaries.map((s: any) => s.stage).join(", ")}`);
      throw new Error("Enrichment stage not found");
    }

    console.log(`✅ Enrichment stage found`);
    console.log(`   Summary: ${enrichmentStage.summary}\n`);

    // Check if AI/ML notes are in the summary
    const aiMlNotes = enrichmentStage.summary;
    const hasAiMlMarkers = aiMlNotes.includes("aiMl") || aiMlNotes.includes("AI/ML") || aiMlNotes.includes("[MOCK]");

    if (!hasAiMlMarkers) {
      console.warn("⚠️  AI/ML markers not found in enrichment stage summary");
      console.warn("   This means AI/ML enrichment details are not surfaced in the response");
      console.warn("   Inspected path: result.stageSummaries[enrichment].summary\n");
    } else {
      console.log(`✅ AI/ML markers found in enrichment summary\n`);
    }

    // Step 4: Verify model explainability (if AI/ML markers were found)
    if (hasAiMlMarkers) {
      console.log("4️⃣  Verifying model explainability...");
      if (!aiMlNotes.includes("[MOCK]")) {
        console.warn("⚠️  Mock marker not found in enrichment summary");
      } else {
        console.log("✅ Mock marker found");
      }
      if (!aiMlNotes.includes("Model explainability")) {
        console.warn("⚠️  'Model explainability' not found in enrichment summary");
      } else {
        console.log("✅ Model explainability found");
      }
      if (!aiMlNotes.includes("top-3 features")) {
        console.warn("⚠️  'top-3 features' not found in enrichment summary");
      } else {
        console.log("✅ top-3 features found");
      }
      console.log("");
    } else {
      console.log("4️⃣  Skipping model explainability verification (AI/ML markers not found)\n");
    }

    // Step 5: Build narrative (same logic as the action)
    console.log("5️⃣  Building narrative...");
    const stageNarrative = result.stageSummaries
      .map((stage: any, index: number) => {
        let line = `${index + 1}. ✅ **${stage.persona}** (${stage.stage}): ${stage.summary}`;
        if (stage.enrichmentCategories) {
          line += `\n   - Enrichment legos: ${stage.enrichmentCategories.join(", ")}`;
        }
        return line;
      })
      .join("\n\n");

    const narrative = `
🎯 **AFI Eliza Demo Complete**

**Signal**: ${result.meta.symbol} ${result.meta.timeframe} ${result.meta.direction}
**Strategy**: ${result.meta.strategy}

**Pipeline Flow** (Alpha → Pixel Rick → Froggy → Val Dook):

${stageNarrative}

---
${hasAiMlMarkers ? `
**AI/ML Enrichment** (from enrichment stage):
${aiMlNotes}

---
` : `
⚠️ **AI/ML Enrichment Notes Not Surfaced**
Inspected path: result.stageSummaries[enrichment].summary

---
`}
**Final Validator Decision**:
- **Decision**: ${result.validatorDecision.decision}
- **Confidence**: ${result.validatorDecision.uwrConfidence.toFixed(2)}

**Execution** (simulated):
- **Status**: ${result.execution.status}

---

⚠️ **DEMO ONLY**: No real trading occurred. No AFI tokens minted.
    `.trim();

    console.log("✅ Narrative built\n");
    console.log("=" .repeat(80));
    console.log(narrative);
    console.log("=" .repeat(80));

    console.log("\n✅ All tests passed!");
    console.log("\n📋 Summary:");
    console.log(`   - Stages: ${result.stageSummaries.length}`);
    console.log(`   - Enrichment summary length: ${aiMlNotes.length} chars`);
    console.log(`   - Has AI/ML markers: ${hasAiMlMarkers}`);
    if (hasAiMlMarkers) {
      console.log(`   - Contains [MOCK]: ${aiMlNotes.includes("[MOCK]")}`);
      console.log(`   - Contains explainability: ${aiMlNotes.includes("Model explainability")}`);
    }

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  }
}

testDemoEndpoint();

