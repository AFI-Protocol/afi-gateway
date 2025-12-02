# AFIScout Overview

AFIScout is an ElizaOS character that helps users turn trade ideas into structured, AFI-ready signal drafts. It prepares deterministic `AfiScoutSignalDraft` payloads and emits them via the `afi-signal-outbox` plugin.

## Scope
- AFIScout only prepares and emits `AfiScoutSignalDraft` payloads.
- No PoI, PoInsight, UWR, novelty scoring, or token emissions decisions are performed here.
- No backend endpoints are implemented in this repo.

## Where the payload goes
- AFI backends (e.g., afi-infra / afi-reactor) will host a future "signal outbox" endpoint to receive these drafts.
- This gateway does not implement that backend; it only prepares the draft payload and logs it.

## Relation to AFI specs
- AFIScout drafts are conceptually upstream of the AFI universal signal schema, NoveltySpec v0.1, RegimeClassifierSpec v0.1, and ValidatorDecisionSpec v0.1.
- Those specs live in the AFI docs repo; this gateway only prepares input for them and does not implement their logic.
