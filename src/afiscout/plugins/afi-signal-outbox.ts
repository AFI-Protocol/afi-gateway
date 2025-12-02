import { elizaLogger } from "@elizaos/core";
import type { AfiScoutSignalDraft } from "../types/afi-scout-signal.js";

type SimplePluginAction = {
  name: string;
  description?: string;
  inputs?: unknown[];
  execute: (input: any) => Promise<any>;
};

type EmitPayload = AfiScoutSignalDraft;

const emitAfiSignalDraft: SimplePluginAction = {
  name: "emitAfiSignalDraft",
  description:
    "Emit an AFI-ready signal draft (no scoring/validation/emissions).",
  inputs: [],
  async execute(input: Partial<EmitPayload>) {
    const required = ["symbol", "market", "timeframe", "action", "thesis"] as const;

    for (const key of required) {
      if (!input[key]) {
        const msg = `[AFIScout] Missing required field: ${key}`;
        elizaLogger.error(msg);
        return { error: msg };
      }
    }

    const payload: AfiScoutSignalDraft = {
      source: "afiscout",
      symbol: input.symbol!,
      market: input.market!,
      timeframe: input.timeframe!,
      action: input.action as AfiScoutSignalDraft["action"],
      thesis: input.thesis!,
      createdAt: input.createdAt ?? new Date().toISOString(),
      regimeTag: input.regimeTag,
      tags: input.tags,
      meta: input.meta,
    };

    elizaLogger.info(
      `[AFIScout] Draft AFI signal: ${JSON.stringify(payload)}`
    );

    // TODO: Send to AFI signal outbox endpoint when available:
    // await fetch("https://afi.example/api/signal-outbox", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });

    return { ok: true, draft: payload };
  },
};

export const afiSignalOutboxPlugin = {
  name: "afi-scout-signal-outbox",
  description:
    "Prepares and emits AFI-ready signal drafts. No scoring, validation, novelty, or tokenomics here.",
  actions: [emitAfiSignalDraft],
};
