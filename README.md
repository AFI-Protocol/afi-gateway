# afi-eliza-gateway

**AFI ↔ Eliza Gateway**

This repository is the integration gateway between AFI Protocol and ElizaOS (Phoenix). It acts as an external client that calls AFI services over HTTP/WebSocket APIs.

---

## What This Repo Contains

- **Phoenix/Eliza character configs** — Character definitions for AFI-specific agents
- **AFI-specific Eliza plugins** — Plugins that integrate Eliza with AFI signal scoring, validation, and tokenomics
- **Client code** — HTTP/WS clients that call AFI services (afi-reactor, afi-core, Codex)

---

## What This Repo Does NOT Contain

- **AFI core business logic** — Signal scoring, validation, and tokenomics live in afi-reactor and afi-core
- **AFI orchestration** — DAG orchestration lives in afi-reactor
- **Direct database access** — All AFI data access happens via AFI APIs

---

## Integration Model

```
┌─────────────────────────────────────┐
│  afi-eliza-gateway (this repo)      │
│  - Eliza character configs          │
│  - AFI-specific Eliza plugins       │
│  - HTTP/WS clients                  │
└──────────────┬──────────────────────┘
               │
               │ HTTP/WS API calls
               ▼
┌─────────────────────────────────────┐
│  AFI Services                       │
│  - afi-reactor (DAG orchestration)  │
│  - afi-core (validators, scoring)   │
│  - Codex (signal replay)            │
└─────────────────────────────────────┘
```

**Dependency Direction**:
- Eliza gateway (this repo) → **depends on** → AFI services
- AFI services → **never depend on** → Eliza gateway

---

## Architecture Principles

1. **AFI is the backend** — This gateway is a client, not the source of truth
2. **Call, don't reimplement** — Always call AFI APIs instead of duplicating logic
3. **Types from afi-core** — Import shared types and client libraries from afi-core
4. **No direct DB access** — All AFI data access happens via AFI HTTP/WS APIs
5. **Eliza stays external** — Upstream ElizaOS code is never vendored into AFI repos

---

## Quick Start

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Build TypeScript
npm run build

# Type check
npm run typecheck

# Run tests
npm test
```

---

## Directory Structure

```
afi-eliza-gateway/
├── src/
│   ├── index.ts              # Gateway entrypoint
│   ├── plugins/              # AFI-specific Eliza plugins
│   ├── characters/           # Eliza character configs
│   └── clients/              # HTTP/WS clients for AFI services
├── package.json
├── tsconfig.json
├── README.md
└── AGENTS.md                 # Droid instructions
```

---

## Contributing

See `AGENTS.md` for droid-specific instructions and boundaries.

All changes must follow the AFI Droid Charter:
- `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`

---

## License

MIT

