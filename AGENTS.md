# afi-eliza-gateway — Agent Instructions

**afi-eliza-gateway** is the AFI ↔ Eliza integration gateway. It hosts Phoenix/Eliza character configs, AFI-specific Eliza plugins, and client code that calls AFI services over HTTP/WS APIs. This repo is an **external client** of AFI services, not part of the AFI core codebase.

**Global Authority**: All agents operating in AFI Protocol repos must follow `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`. If this AGENTS.md conflicts with the Charter, **the Charter wins**.

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

# Run tests (placeholder for now)
npm test

# Run in dev mode
npm run dev
```

**Expected outcomes**: TypeScript compiles, type checking passes, tests pass (when implemented).

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
1. Edit character configs in `src/characters/`
2. Edit AFI-specific plugins in `src/plugins/`
3. Update client code in `src/clients/` to call AFI APIs
4. Run `npm run typecheck` to verify types
5. Run `npm run dev` to test locally

---

## Architecture Overview

**Purpose**: Integrate ElizaOS (Phoenix) with AFI Protocol by calling AFI services over HTTP/WS APIs.

**Key directories**:
- `src/index.ts` — Gateway entrypoint (Phoenix/Eliza bootstrap)
- `src/plugins/` — AFI-specific Eliza plugins
- `src/characters/` — Eliza character configs
- `src/clients/` — HTTP/WS clients for AFI services (Reactor, Core, Codex)

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
- **Character configs**: JSON or YAML in `src/characters/`
- **Plugins**: Follow ElizaOS plugin interface
- **Clients**: Use types from afi-core, call AFI APIs over HTTP/WS
- **Tests**: Placeholder for now (exit 0)

---

## Scope & Boundaries for Agents

**Droid Roles** (conceptual, no special syntax):

1. **Phoenix Gateway Droid** — Maintains Eliza config, characters, routing, and gateway-level behavior.
2. **Plugin Integration Droid** — Keeps AFI plugin integration code in sync with AFI schemas and APIs, using types/clients from afi-core.

**Allowed**:
- Edit Eliza character configs in `src/characters/`
- Edit AFI-specific Eliza plugins in `src/plugins/`
- Update client code in `src/clients/` that calls AFI HTTP/WS APIs
- Import types and client libraries from afi-core
- Add tests for plugins and client code
- Update documentation

**Forbidden**:
- Reimplement AFI scoring, signal logic, or tokenomics in this repo
- Direct database access into AFI persistence layers
- Pull or vendor upstream ElizaOS into AFI repos (Charter forbids this)
- Import ElizaOS code into afi-reactor, afi-core, or other AFI core modules
- Add orchestration logic (that belongs in afi-reactor)
- Modify AFI core business logic from this repo

**Ambiguous**:
- When in doubt, prefer calling an AFI service or asking for human review rather than duplicating logic.
- If you need new AFI functionality, propose it in afi-reactor or afi-core, not here.

---

**Last Updated**: 2025-11-26  
**Maintainers**: AFI Gateway Team  
**Charter**: `../afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`

