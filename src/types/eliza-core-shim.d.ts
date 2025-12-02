declare module "@elizaos/core" {
  export { AgentRuntime } from "@elizaos/core/dist/runtime.js";
  export { elizaLogger } from "@elizaos/core/dist/logger.js";
  export type { Character } from "@elizaos/core/dist/types/agent";
  export type { Plugin } from "@elizaos/core/dist/plugin";
  export type { Action, Provider, Evaluator } from "@elizaos/core/dist/types/components";
  export type { IAgentRuntime } from "@elizaos/core/dist/types/runtime";
  export type { Memory } from "@elizaos/core/dist/types/memory";
  export type { State } from "@elizaos/core/dist/types/state";
}
