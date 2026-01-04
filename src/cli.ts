#!/usr/bin/env node

/**
 * AFI Gateway CLI
 *
 * Command-line interface for AFI Gateway operations.
 */

import { CliApp } from '@afi/cli-framework';
import { handleAfiCliCommand } from './afiCli.js';
import { AgentRuntime, elizaLogger } from "@elizaos/core";
import { afiTelemetryPlugin } from "../plugins/afi-telemetry/index.js";
import { afiReactorActionsPlugin } from "../plugins/afi-reactor-actions/index.js";

class AfiGatewayCli extends CliApp {
  constructor() {
    super('afi-gateway', '0.1.0', {
      // Default config values
    });

    this.description('AFI Gateway CLI for agent operations');
  }

  public async getRuntime(): Promise<AgentRuntime> {
    // Initialize AgentRuntime framework (no default character)
    const runtime = new AgentRuntime({
      adapter: undefined,
    });

    await runtime.registerPlugin(afiTelemetryPlugin);
    await runtime.registerPlugin(afiReactorActionsPlugin);

    return runtime;
  }
}

// Create CLI instance
const cli = new AfiGatewayCli();

// Add commands
cli
  .command('eliza-demo')
  .description('Run AFI Eliza Demo pipeline')
  .action(async () => {
    const runtime = await cli.getRuntime();
    const result = await handleAfiCliCommand('eliza-demo', runtime);
    console.log(result);
  });

cli
  .command('reactor <subcommand>')
  .description('AFI Reactor operations')
  .action(async (subcommand: string) => {
    const runtime = await cli.getRuntime();
    const result = await handleAfiCliCommand(`reactor ${subcommand}`, runtime);
    console.log(result);
  });

cli
  .command('validator <subcommand>')
  .description('Validator operations')
  .action(async (subcommand: string) => {
    const runtime = await cli.getRuntime();
    const result = await handleAfiCliCommand(`validator ${subcommand}`, runtime);
    console.log(result);
  });

cli
  .command('help')
  .description('Show help information')
  .action(async () => {
    const runtime = await cli.getRuntime();
    const result = await handleAfiCliCommand('help', runtime);
    console.log(result);
  });

// Run CLI
cli.run();
