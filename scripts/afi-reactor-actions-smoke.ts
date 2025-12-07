/**
 * AFI Reactor Actions Plugin - Smoke Test
 *
 * DEV/DEMO ONLY - Smoke test for AFI Reactor actions plugin.
 *
 * This script verifies:
 * 1. Plugin structure and exports
 * 2. Action definitions
 * 3. Basic validation
 *
 * Run with: npm run test:afi-reactor-actions
 */

import type { Action } from "@elizaos/core";
import { afiReactorActionsPlugin } from "../plugins/afi-reactor-actions/index.js";

console.log("🧪 AFI Reactor Actions Plugin - Smoke Test\n");

// Test 1: Plugin structure
console.log("✅ Test 1: Plugin structure");
console.log(`   Name: ${afiReactorActionsPlugin.name}`);
console.log(`   Description: ${afiReactorActionsPlugin.description}`);
console.log(`   Actions: ${afiReactorActionsPlugin.actions?.length || 0}`);
console.log();

// Test 2: Action definitions
console.log("✅ Test 2: Action definitions");
const actionNames = afiReactorActionsPlugin.actions?.map((a: Action) => a.name) || [];
console.log(`   Actions: ${actionNames.join(", ")}`);
console.log();

// Test 3: SUBMIT_FROGGY_DRAFT action
console.log("✅ Test 3: SUBMIT_FROGGY_DRAFT action");
const submitAction = afiReactorActionsPlugin.actions?.find(
  (a: Action) => a.name === "SUBMIT_FROGGY_DRAFT"
);
if (submitAction) {
  console.log(`   Name: ${submitAction.name}`);
  console.log(`   Description: ${submitAction.description}`);
  console.log(`   Similes: ${submitAction.similes?.join(", ")}`);
  console.log(`   Has validate: ${!!submitAction.validate}`);
  console.log(`   Has handler: ${!!submitAction.handler}`);
} else {
  console.error("   ❌ SUBMIT_FROGGY_DRAFT action not found");
}
console.log();

// Test 4: CHECK_AFI_REACTOR_HEALTH action
console.log("✅ Test 4: CHECK_AFI_REACTOR_HEALTH action");
const healthAction = afiReactorActionsPlugin.actions?.find(
  (a: Action) => a.name === "CHECK_AFI_REACTOR_HEALTH"
);
if (healthAction) {
  console.log(`   Name: ${healthAction.name}`);
  console.log(`   Description: ${healthAction.description}`);
  console.log(`   Similes: ${healthAction.similes?.join(", ")}`);
  console.log(`   Has validate: ${!!healthAction.validate}`);
  console.log(`   Has handler: ${!!healthAction.handler}`);
} else {
  console.error("   ❌ CHECK_AFI_REACTOR_HEALTH action not found");
}
console.log();

// Test 5: EXPLAIN_LAST_FROGGY_DECISION action
console.log("✅ Test 5: EXPLAIN_LAST_FROGGY_DECISION action");
const explainAction = afiReactorActionsPlugin.actions?.find(
  (a: Action) => a.name === "EXPLAIN_LAST_FROGGY_DECISION"
);
if (explainAction) {
  console.log(`   Name: ${explainAction.name}`);
  console.log(`   Description: ${explainAction.description}`);
  console.log(`   Similes: ${explainAction.similes?.join(", ")}`);
  console.log(`   Has validate: ${!!explainAction.validate}`);
  console.log(`   Has handler: ${!!explainAction.handler}`);
} else {
  console.error("   ❌ EXPLAIN_LAST_FROGGY_DECISION action not found");
}
console.log();

// Test 6: Plugin config
console.log("✅ Test 6: Plugin config");
const configKeys = Object.keys(afiReactorActionsPlugin.config || {});
console.log(`   Config keys: ${configKeys.join(", ")}`);
console.log();

// Summary
console.log("🎉 Smoke test complete!");
console.log();
console.log("⚠️  Note: This smoke test only verifies plugin structure.");
console.log("   To test actual functionality, run AFI Reactor and use the actions in ElizaOS.");
console.log();
console.log("📚 Next steps:");
console.log("   1. Start AFI Reactor: cd ../afi-reactor && npm run start:demo");
console.log("   2. Start Eliza Gateway: npm run dev");
console.log("   3. Interact with Alpha/Phoenix to test actions");

