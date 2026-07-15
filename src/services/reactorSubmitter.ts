/**
 * Reactor Submitter — the Gateway's ONLY path for inbound signal submissions.
 *
 * BOUNDARY (AFI-GOV-PERSISTENCE-IMPL-v0.1, Slot 4 MONGO-GATEWAY-BOUNDARY):
 * The Gateway is an external submission and routing boundary. It forwards an
 * authenticated raw ingestion payload to the Reactor's existing live ingestion
 * surface and returns what the Reactor says. It does NOT score, resolve UWR,
 * construct the canonical scored-signal evidence record, or write to any store.
 * Canonical scoring, UWR resolution, evidence construction and evidence
 * submission are owned by the Reactor (D-MONGO-3: submitter, not writer).
 *
 * The only fact this module asserts is PROVENANCE: `providerId` is derived from
 * the authenticated API key's tenant, overwriting anything the caller sent. A
 * caller must not be able to spoof who supplied a signal. No scoring fact —
 * score, axes, decay, stamp, timestamps, lifecycle — is ever asserted here.
 */

/** Raw ingestion payload, forwarded to the Reactor as-is (plus provenance). */
export type RawSignalSubmission = Record<string, unknown>;

/** The Reactor's verbatim answer. No interpretation, no retry, no fallback. */
export interface ReactorSubmission {
  status: number;
  body: any;
  /**
   * True when the Reactor answered but its response body could not be read.
   * The Reactor had already run by then, so the persistence outcome is UNKNOWN:
   * it must never be reported as "not persisted".
   */
  bodyUnreadable?: boolean;
}

export type ReactorSubmitter = (
  tenantId: string,
  payload: RawSignalSubmission
) => Promise<ReactorSubmission>;

/**
 * Build the live submitter.
 *
 * Fails closed: with no `AFI_REACTOR_BASE_URL` there is no honest way to score a
 * submission, so the Gateway refuses to start rather than accept signals it
 * cannot forward. There is deliberately no localhost default, no queue, no
 * retry, no offline/demo mode and no fallback persistence.
 */
export function createReactorSubmitterFromEnv(): ReactorSubmitter {
  const baseUrl = process.env.AFI_REACTOR_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "AFI_REACTOR_BASE_URL is required — the Gateway submits every signal to the Reactor and never persists canonical evidence itself."
    );
  }
  return createReactorSubmitter(baseUrl, process.env.WEBHOOK_SHARED_SECRET);
}

export function createReactorSubmitter(
  baseUrl: string,
  sharedSecret?: string
): ReactorSubmitter {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/webhooks/tradingview`;

  return async (tenantId, payload) => {
    const body: Record<string, unknown> = {
      ...payload,
      // Authenticated provenance. Overwrites any caller-supplied providerId:
      // at this boundary the authenticated tenant IS the provider, so this is a
      // fact the Gateway owns rather than one it invents.
      providerId: `gateway:${tenantId}`,
    };

    // The Reactor reads the shared secret from the request BODY, not a header.
    if (sharedSecret) body.secret = sharedSecret;

    // A throw here is a genuine transport failure: the Reactor never answered,
    // so nothing was scored or persisted. It propagates to the caller.
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Past this point the Reactor HAS answered and may already have persisted a
    // record. A failure to read its body therefore leaves the outcome unknown —
    // reporting "not persisted" here would be inventing a fact.
    let text: string;
    try {
      text = await res.text();
    } catch {
      return { status: res.status, body: {}, bodyUnreadable: true };
    }

    let parsed: any = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { message: text };
    }

    return { status: res.status, body: parsed };
  };
}

/**
 * Map a Reactor status onto the Gateway's response status.
 *
 * Total by construction: every branch reports the truth of what the Reactor did.
 * There is no 202, and no masked 200 — the Gateway never acknowledges a signal
 * that was not actually scored and persisted (D-MONGO-8; no governed
 * asynchronous contract exists that would permit deferred acknowledgement).
 */
export function mapReactorStatus(reactorStatus: number): number {
  switch (reactorStatus) {
    case 200:
      return 200; // one canonical record exists, stamped by the Reactor
    case 400:
      return 400; // the caller's payload is genuinely invalid
    case 401:
      // The GATEWAY's shared secret is wrong — not the caller's API key.
      // Returning 401 here would falsely blame the caller.
      return 502;
    case 409:
      return 409; // same signalId, different content — append-once conflict
    case 422:
      return 422; // upstream normalization rejection
    case 503:
      return 503; // canonical store genuinely unavailable
    default:
      return 502; // any other upstream outcome is an upstream fault
  }
}

/**
 * Project the Reactor's response for the caller.
 *
 * Echoes ONLY the join key and the persistence outcome. `rawUss`, `analystScore`,
 * `uwrResolvedSource` and `decayParams` are deliberately dropped: the Gateway
 * must not restate scoring facts it does not own.
 */
export function projectReactorResponse(
  reactorStatus: number,
  body: any,
  tenantId: string
): Record<string, unknown> {
  if (reactorStatus === 200) {
    return {
      signalId: signalIdOf(body),
      tenantId,
      persistence: body?.persistence,
    };
  }

  if (reactorStatus === 409) {
    return {
      error: "evidence_persistence_conflict",
      signalId: body?.signalId,
      persisted: false,
      message: body?.message,
    };
  }

  if (reactorStatus === 503) {
    return {
      error: "evidence_persistence_unavailable",
      persisted: false,
      message: body?.message,
    };
  }

  if (reactorStatus === 400 || reactorStatus === 422) {
    return {
      error: "upstream_rejected",
      reactorStatus,
      persisted: false,
      message: body?.error ?? body?.message,
    };
  }

  if (reactorStatus === 401) {
    return {
      error: "reactor_auth_failed",
      persisted: false,
      message: "The Gateway is not authorized to submit to the Reactor.",
    };
  }

  return {
    error: "reactor_error",
    reactorStatus,
    persisted: false,
    message: body?.error ?? body?.message,
  };
}

function signalIdOf(body: any): string | undefined {
  return body?.signalId ?? body?.persistence?.signalId;
}

/**
 * A Reactor 200 is only a success if it actually carries the evidence of one:
 * the canonical join key and the persistence outcome. A 200 without them is not
 * this Reactor's scoring surface answering (a proxy, a health shim, a wrong base
 * URL, or a Reactor predating canonical persistence), so the Gateway must not
 * pass it off as an acknowledgement.
 */
function hasPersistenceEvidence(body: any): boolean {
  return Boolean(signalIdOf(body)) && Boolean(body?.persistence?.outcome);
}

/**
 * Turn the Reactor's answer into the Gateway's response. One total function, so
 * a status can never drift apart from the body that explains it.
 *
 * `persisted` is a three-valued fact, deliberately: `false` means the Gateway
 * KNOWS nothing was persisted; `"unknown"` means the outcome is genuinely
 * undetermined and the caller must resolve it by resubmitting the same
 * `signalId` (which the Reactor answers idempotently) rather than assuming
 * either way. The Gateway never guesses.
 */
export function projectSubmission(
  submission: ReactorSubmission,
  tenantId: string
): { status: number; body: Record<string, unknown> } {
  if (submission.bodyUnreadable) {
    return {
      status: 502,
      body: {
        error: "reactor_response_unreadable",
        persisted: "unknown",
        message:
          "The Reactor answered but its response could not be read; the persistence outcome is undetermined. Resubmit the same signalId to resolve it idempotently.",
      },
    };
  }

  if (submission.status === 200 && !hasPersistenceEvidence(submission.body)) {
    return {
      status: 502,
      body: {
        error: "reactor_error",
        reactorStatus: 200,
        persisted: "unknown",
        message:
          "The Reactor reported success without canonical persistence evidence; the Gateway cannot confirm a canonical record exists.",
      },
    };
  }

  return {
    status: mapReactorStatus(submission.status),
    body: projectReactorResponse(submission.status, submission.body, tenantId),
  };
}
