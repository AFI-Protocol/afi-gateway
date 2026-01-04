# afi-gateway — Agent Instructions

**afi-gateway** is AFI's universal gateway framework for custom character development. It provides a framework for building custom characters with skills, AFI-specific Eliza plugins, and client code that calls AFI services over HTTP/WS APIs. This repo is an **external client** of AFI services, not part of the AFI core codebase.

**Global Authority**: All agents operating in AFI Protocol repos must follow `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`. If this AGENTS.md conflicts with the Charter, **the Charter wins**.

For global droid behavior and terminology, see:
- `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`
- `afi-config/codex/governance/droids/AFI_DROID_PLAYBOOK.v0.1.md`
- `afi-config/codex/governance/droids/AFI_DROID_GLOSSARY.md`

**⚠️ CRITICAL**: This gateway MUST call AFI services (afi-reactor, afi-core) over HTTP/WS. It MUST NOT reimplement AFI business logic.

---

## Build & Test

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Type check
npm run typecheck

# Run tests
npm test

# Run in dev mode
npm run dev
```

**Expected outcomes**: TypeScript compiles, type checking passes, tests pass.

---

## Run Locally / Dev Workflow

```bash
# Run gateway in dev mode
npm run dev

# Type check without building
npm run typecheck

# Build for production
npm run build
```

**Typical workflow**:
1. Create custom character configs in `src/characters/`
2. Edit AFI-specific plugins in `src/plugins/`
3. Update client code in `src/clients/` to call AFI APIs
4. Run `npm run typecheck` to verify types
5. Run `npm run dev` to test locally
6. See `docs/CHARACTER_DEVELOPMENT.md` for detailed guides

---

## Architecture Overview

**Purpose**: Provide AFI's universal gateway framework for custom character development, enabling seamless connectivity between various platforms and AFI Protocol services.

**Key directories**:
- `src/index.ts` — Gateway entrypoint (ElizaOS bootstrap)
- `src/server-full.ts` — Full ElizaOS server with custom character support
- `src/server.ts` — Minimal HTTP server for health checks
- `src/plugins/` — AFI-specific Eliza plugins
- `src/characters/` — Custom character configs (create your own here)
- `src/clients/` — HTTP/WS clients for AFI services (Reactor, Core, Codex)
- `docs/CHARACTER_DEVELOPMENT.md` — Guide for creating custom characters

**Depends on**: afi-core (types, client libraries), afi-reactor (HTTP/WS APIs), ElizaOS SDK  
**Consumed by**: End users, Discord/Telegram bots, web interfaces

**Integration model**:
- This gateway is an **external client** of AFI services
- It calls AFI APIs (afi-reactor, afi-core) over HTTP/WS
- It uses types and client libraries from afi-core
- AFI services never depend on this gateway

---

## Security

- **No AFI business logic here**: All signal scoring, validation, and tokenomics happen in AFI services.
- **No direct DB access**: All AFI data access happens via AFI HTTP/WS APIs.
- **No secrets in code**: Use environment variables for API keys and credentials.
- **Character configs are public**: Do not include sensitive data in character files.

---

## Git Workflows

- **Base branch**: `main`
- **Branch naming**: `feat/`, `fix/`, `plugin/`, `character/`
- **Commit messages**: Conventional commits (e.g., `feat(plugin): add signal scoring plugin`)
- **Before committing**: Run `npm run typecheck && npm test`

---

## Conventions & Patterns

- **Language**: TypeScript (ESM)
- **Character configs**: TypeScript files in `src/characters/` (see CHARACTER_DEVELOPMENT.md)
- **Plugins**: Follow ElizaOS plugin interface
- **Clients**: Use types from afi-core, call AFI APIs over HTTP/WS
- **Tests**: Vitest for unit and integration tests

---

## Scope & Boundaries for Agents

**Droid Roles** (conceptual, no special syntax):

1. **Gateway Framework Droid** — Maintains the gateway framework, routing, and infrastructure for custom character development.
2. **Plugin Integration Droid** — Keeps AFI plugin integration code in sync with AFI schemas and APIs, using types/clients from afi-core.
3. **Character Development Droid** — Helps community members create and integrate custom characters with skills.

**Allowed**:
- Create custom character configs in `src/characters/`
- Edit AFI-specific Eliza plugins in `src/plugins/`
- Update client code in `src/clients/` that calls AFI HTTP/WS APIs
- Import types and client libraries from afi-core
- Add tests for plugins and client code
- Update documentation
- Create guides and examples for custom character development

**Forbidden**:
- Reimplement AFI scoring, signal logic, or tokenomics in this repo
- Direct database access into AFI persistence layers
- Pull or vendor upstream ElizaOS into AFI repos (Charter forbids this)
- Import ElizaOS code into afi-reactor, afi-core, or other AFI core modules
- Add orchestration logic (that belongs in afi-reactor)
- Modify AFI core business logic from this repo

**Ambiguous**: When in doubt, prefer calling an AFI service or asking for human review rather than duplicating logic. If you need new AFI functionality, propose it in afi-reactor or afi-core, not here.

## Custom Character Development

This gateway is designed as a framework for community-driven character development. No pre-built characters are included.

**Creating Custom Characters**:

1. **Character Structure**: Create a TypeScript file in `src/characters/your-character.ts`:
   ```typescript
   import type { Character } from "@elizaos/core";

   export const yourCharacter: Character = {
     name: "YourCharacter",
     username: "yourcharacter",
     bio: ["Your character description"],
     system: "Your character's system prompt...",
     plugins: ["@elizaos/plugin-bootstrap", "@afi/plugin-afi-reactor-actions"],
     // ... other character properties
   };
   ```

2. **Skills System**: Characters can use AFI skills through plugins:
   - Signal submission via `@afi/plugin-afi-reactor-actions`
   - Health checks and telemetry
   - Custom actions and evaluators

3. **Integration**: Import and start your character in `src/server-full.ts`:
   ```typescript
   import { yourCharacter } from "./characters/your-character.js";
   await server.startAgent(yourCharacter);
   ```

**See `docs/CHARACTER_DEVELOPMENT.md` for detailed guides and examples.**

## AFIScout Scope (Eliza Gateway)

- AFIScout is an example character plus a minimal plugin (`afi-signal-outbox`) that emits AFI-ready signal drafts.
- Allowed paths: `src/afiscout/**`, `docs/AFISCOUT_OVERVIEW.md`.
- Must NOT modify token contracts, emissions logic, or AFI backend repos; no direct DB access.
- AFIScout only prepares drafts; AFI validators/backends handle PoI, PoInsight, UWR, novelty, and replay.

---

**Last Updated**: 2026-01-04 | **Maintainers**: AFI Gateway Team | **Charter**: `../afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`
