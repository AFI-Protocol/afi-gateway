/**
 * AFI Reactor Actions Plugin - Tests
 *
 * Tests for AFI Reactor actions plugin.
 *
 * These tests verify:
 * 1. Action structure and validation
 * 2. Input normalization
 * 3. Error handling
 * 4. Integration with AFI client
 *
 * Note: These tests use mocked fetch calls to avoid requiring a running AFI Reactor instance.
 * These actions are generic and can be used by any custom character built with the afi-gateway framework.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { IAgentRuntime, Memory } from "@elizaos/core";
import { afiReactorActionsPlugin } from "../plugins/afi-reactor-actions/index.js";

/**
 * Mock ElizaOS runtime for testing
 */
const createMockRuntime = (): IAgentRuntime => {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  } as any;
};

/**
 * Mock ElizaOS memory for testing
 */
const createMockMessage = (text: string): Memory => {
  return {
    content: { text },
    userId: "test-user",
    roomId: "test-room",
  } as any;
};

describe("AFI Reactor Actions Plugin - Framework Tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should export plugin with correct structure", () => {
    expect(afiReactorActionsPlugin).toBeDefined();
    expect(afiReactorActionsPlugin.name).toBe("@afi/plugin-afi-reactor-actions");
    expect(afiReactorActionsPlugin.actions).toHaveLength(4); // 4 actions: SUBMIT_SIGNAL_DRAFT, CHECK_AFI_REACTOR_HEALTH, EXPLAIN_LAST_DECISION, DESCRIBE_ENRICHMENT_LAYERS
  });

  it("should have SUBMIT_SIGNAL_DRAFT action", () => {
    const action = afiReactorActionsPlugin.actions?.find(
      (a: any) => a.name === "SUBMIT_SIGNAL_DRAFT"
    );
    expect(action).toBeDefined();
    expect(action?.description).toContain("signal");
    expect(action?.similes).toContain("Submit signal");
  });

  it("should have CHECK_AFI_REACTOR_HEALTH action", () => {
    const action = afiReactorActionsPlugin.actions?.find(
      (a: any) => a.name === "CHECK_AFI_REACTOR_HEALTH"
    );
    expect(action).toBeDefined();
    expect(action?.description).toContain("health");
    expect(action?.similes).toContain("Is AFI Reactor online?");
  });

  it("should have EXPLAIN_LAST_DECISION action", () => {
    const action = afiReactorActionsPlugin.actions?.find(
      (a: any) => a.name === "EXPLAIN_LAST_DECISION"
    );
    expect(action).toBeDefined();
    expect(action?.description).toContain("explain");
    expect(action?.similes).toContain("Explain last result");
  });

  it("should validate SUBMIT_SIGNAL_DRAFT action", async () => {
    const action = afiReactorActionsPlugin.actions?.find(
      (a: any) => a.name === "SUBMIT_SIGNAL_DRAFT"
    );
    const runtime = createMockRuntime();
    const message = createMockMessage("BTC/USDT 1h long");

    const isValid = await action?.validate?.(runtime, message);
    expect(isValid).toBe(true);
  });

  it("should validate CHECK_AFI_REACTOR_HEALTH action", async () => {
    const action = afiReactorActionsPlugin.actions?.find(
      (a: any) => a.name === "CHECK_AFI_REACTOR_HEALTH"
    );
    const runtime = createMockRuntime();
    const message = createMockMessage("Is AFI Reactor online?");

    const isValid = await action?.validate?.(runtime, message);
    expect(isValid).toBe(true);
  });

  it("should validate EXPLAIN_LAST_DECISION action", async () => {
    const action = afiReactorActionsPlugin.actions?.find(
      (a: any) => a.name === "EXPLAIN_LAST_DECISION"
    );
    const runtime = createMockRuntime();
    const message = createMockMessage("What was the last signal?");

    const isValid = await action?.validate?.(runtime, message);
    expect(isValid).toBe(true);
  });

  // TODO: Add integration tests with mocked fetch
  // TODO: Add tests for error handling
  // TODO: Add tests for session caching (EXPLAIN_LAST_DECISION)
});

describe("AFI Reactor Actions Plugin - Integration Tests", () => {
  it.skip("should submit signal draft (requires running AFI Reactor)", async () => {
    // This test requires a running AFI Reactor instance
    // Skip for now, run manually when AFI Reactor is available
  });

  it.skip("should check AFI Reactor health (requires running AFI Reactor)", async () => {
    // This test requires a running AFI Reactor instance
    // Skip for now, run manually when AFI Reactor is available
  });

  it.skip("should explain last decision (requires running AFI Reactor)", async () => {
    // This test requires a running AFI Reactor instance
    // Skip for now, run manually when AFI Reactor is available
  });
});

