# afi-gateway

**AFI's Universal Gateway Framework for Custom Character Development**

This repository is AFI's universal gateway framework for building custom characters with skills. It acts as an external client that calls AFI services over HTTP/WebSocket APIs.

**🎯 Framework Focus**: This gateway is designed as a framework for community-driven character development. No pre-built characters are included. Create your own custom characters with skills using the guides in `docs/CHARACTER_DEVELOPMENT.md`.

---

## AFI Gateway ingress boundary and reference-service role

This repository is the open-source **AFI Gateway** — AFI's structured-signal
**submission boundary**. Its ingress server (`start:minimal`, `src/http/app.ts`)
exposes `POST /api/v1/signals`, which authenticates the API key, resolves the
tenant, rate-limits per key, performs a **presence-only** field check, stamps
provenance (`providerId = gateway:<tenantId>`), forwards the payload to the
Reactor, and returns the Reactor's answer verbatim.

- **Routes, never writes.** The Gateway never constructs or writes canonical
  evidence — an executable guardrail (`tests/guardrails/no-canonical-evidence-writer.test.ts`)
  and a real-MongoDB boundary proof enforce this in CI. It is **not** the
  canonical evidence writer (`afi-infra` is) and **not** the API Atlas.
- **Conform or adapt.** Structured sources must conform to the supported request
  contract (the required-present fields, with additional fields forwarded
  verbatim to the Reactor) or use an adapter. Arbitrary webhook JSON is not a
  universal accepted format.

**AFI Research Institute is designated to operate the official hosted Gateway
reference instance** (see [`AFI-GOV-AUTHORITY-INSTITUTE-REFERENCE-SERVICES-v0.1` (INST-GOV)](https://github.com/AFI-Protocol/afi-governance/blob/main/decisions/research-institute-reference-services-v0.1.md)
and the [reference-services spec](https://github.com/AFI-Protocol/afi-docs/blob/main/specs/AFI_RESEARCH_INSTITUTE_REFERENCE_SERVICES.v0.1.md)).
This designation is **non-exclusive**:

- the MIT-licensed implementation here remains usable by **independent conforming
  operators**, who may run it or a conforming re-implementation of the same
  boundary;
- any Institute hosted-instance policies (onboarding, quotas, tenant isolation,
  retention) apply **only** to that hosted instance and are not protocol law;
- **no Institute-hosted deployment is claimed** — none exists; the Gateway is
  implemented and CI-proven, not deployed.

This repository stays generic AFI Gateway code: it carries no Institute-specific
package name and no hardcoded Institute tenant identity.

---

## What This Repo Contains

- **Framework for custom characters** — Build your own characters with skills
- **AFI-specific Eliza plugins** — Plugins that integrate Eliza with AFI signal scoring, validation, and tokenomics
- **Client code** — HTTP/WS clients that call AFI services (afi-reactor, afi-core, Codex)
- **Character development guides** — Documentation for creating custom characters

---

## What This Repo Does NOT Contain

- **AFI core business logic** — Signal scoring, validation, and tokenomics live in afi-reactor and afi-core
- **AFI orchestration** — the manifest-driven pipeline runtime lives in afi-reactor
- **Direct database access** — All AFI data access happens via AFI APIs

---

## Integration Model

```
┌─────────────────────────────────────┐
│  afi-gateway (this repo)            │
│  - Custom character framework       │
│  - AFI-specific Eliza plugins       │
│  - HTTP/WS clients                  │
└──────────────┬──────────────────────┘
                │
                │ HTTP/WS API calls
                ▼
┌─────────────────────────────────────┐
│  AFI Services                       │
│  - afi-reactor (pipeline runtime)   │
│  - afi-core (validators, scoring)   │
│  - afi-infra (evidence store)       │
└─────────────────────────────────────┘
```

**Dependency Direction**:
- Gateway (this repo) → **depends on** → AFI services
- AFI services → **never depend on** → Gateway

---

## Dependency provenance

`afi-gateway` runs on **ElizaOS** (`@elizaos/core`). Its upstream dependency tree resolves additional third-party packages into `package-lock.json` that AFI does not import, configure, or build on. Those are upstream vendor metadata, not part of AFI's architecture.

AFI's orchestration is the manifest-driven pipeline runtime in **`afi-reactor`**; signal scoring, validation, and minting source of truth remain **`afi-reactor`**, **`afi-core`**, and **`afi-config`** — not this gateway.

See [`afi-docs/ARCHITECTURE_STATUS.md`](https://github.com/AFI-Protocol/afi-docs/blob/main/ARCHITECTURE_STATUS.md) for the architecture summary.

---

## Architecture Principles

1. **AFI is the backend** — This gateway is a client, not the source of truth
2. **Call, don't reimplement** — Always call AFI APIs instead of duplicating logic
3. **Types from afi-core** — Import shared types and client libraries from afi-core
4. **No direct DB access** — All AFI data access happens via AFI HTTP/WS APIs
5. **Eliza stays external** — Upstream ElizaOS code is never vendored into AFI repos

---

## Quick Start

### Prerequisites

- Node.js 20+ (for ElizaOS compatibility)
- npm or yarn
- OpenAI API key (for LLM functionality)

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```bash
# REQUIRED: OpenAI API key for LLM
# Get your key from: https://platform.openai.com/api-keys
# This is the ONLY source of truth for the OpenAI API key
# The key is validated at startup and only the last 4 characters are logged
OPENAI_API_KEY=sk-your-actual-key-here

# Optional: MongoDB connection string (for gateway-specific data)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Optional: Override default database name (defaults to "afi_eliza")
AFI_MONGO_DB_NAME=afi_eliza

# Optional: AFI Reactor URL (defaults to http://localhost:8080)
AFI_REACTOR_BASE_URL=http://localhost:8080

# Optional: Discord bot credentials (for Discord client)
# DISCORD_APPLICATION_ID=your_discord_app_id
# DISCORD_API_TOKEN=your_discord_bot_token
```

**Important**:
- Never commit your `.env` file (it's in `.gitignore`)
- The OpenAI API key must start with `sk-` and be at least 20 characters
- At startup, you'll see a log showing the last 4 characters of your key for verification

### Running

**Development Modes:**

```bash
# CLI mode (interactive terminal)
pnpm dev
# Runs: tsx src/index.ts
# Provides: AFI> CLI prompt for chatting with custom characters

# HTTP server mode (minimal Express server)
pnpm dev:server
# Runs: tsx src/server.ts
# Provides: /healthz, / endpoints on port 8080

# Full ElizaOS server mode (recommended for web client)
pnpm dev:server-full
# Runs: tsx src/server-full.ts
# Provides: Full ElizaOS API framework for custom characters on port 8080
# Endpoints: /, /health, /api/health, /api/agents, WebSocket
```

**Production:**

```bash
# Build TypeScript
pnpm build

# Run production build (full server)
pnpm start

# Type check
pnpm typecheck

# Run tests
pnpm test
```

**Which mode should I use?**
- **Local development with CLI**: `pnpm dev` (talk to custom characters in terminal)
- **Testing HTTP endpoints**: `pnpm dev:server-full` (full ElizaOS API framework)
- **Production deployment**: `pnpm build && pnpm start`

---

## HTTP Endpoints

When running in **full server mode** (`pnpm dev:server-full`), the gateway provides these HTTP endpoints:

### Web UI
- **GET /** — ElizaOS Web UI (interactive chat interface)
  ```bash
  # Open in browser: http://localhost:8080/
  ```

### Health Checks
- **GET /health** — ElizaOS health check with agent status
  ```bash
  curl http://localhost:8080/health
  # Returns: {"status":"OK","version":"unknown","timestamp":"...","dependencies":{"agents":"healthy"},"agentCount":5}
  ```

### Agent API (ElizaOS Standard)
- **GET /api/agents** — List all available custom agents
   ```bash
   curl http://localhost:8080/api/agents
   ```
- **POST /api/agents/:id/message** — Send a message to a specific agent
   ```bash
   curl -X POST http://localhost:8080/api/agents/AGENT_ID/message \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello!", "userId": "user123"}'
   ```
- **GET /api/agents/:id/rooms** — List rooms for a specific agent
   ```bash
   curl http://localhost:8080/api/agents/AGENT_ID/rooms
   ```

### WebSocket
- **ws://localhost:8080/** — Real-time chat via WebSocket (used by web UI)

**Default Port:** 8080 (configurable via `PORT` environment variable)

**Note:** The ElizaOS server provides a full web UI at the root path. For API-only access, use the `/api/*` endpoints.

---

## MongoDB (AFI Gateway)

### Scope

This repository uses MongoDB for **gateway-specific data only**:

- ✅ Chat/session history for custom characters
- ✅ Gateway-specific data (e.g., healthcheck collection)
- ✅ Future gateway-specific metadata

**IMPORTANT**: This is **NOT** for TSSD vault data. The canonical TSSD vault lives in other AFI repos (`afi-reactor`, `afi-infra`) and uses separate database and collection names.

### Database & Collections

- **Database**: `afi_eliza` (default, can be overridden via `AFI_MONGO_DB_NAME`)
- **Collections**: `sessions`, `messages`, `demo_health`, etc.

### Setup

1. **Get MongoDB Atlas connection string**:
   - Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a database user with read/write permissions
   - Whitelist your IP address (or use `0.0.0.0/0` for development)
   - Copy the connection string

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and set MONGODB_URI to your Atlas connection string
   ```

3. **Test the connection**:
   ```bash
   npm install
   npm run test:mongo
   ```

   Expected output:
   ```
   🔍 AFI Gateway — MongoDB Smoke Test
   ============================================================
   [1/4] Connecting to MongoDB...
   ✅ Connected to database: afi_eliza
   [2/4] Accessing collection: demo_health
   ✅ Collection ready
   [3/4] Inserting test document...
   ✅ Document inserted with _id: 507f1f77bcf86cd799439011
   [4/4] Reading document back...
   ✅ Document retrieved successfully
   ============================================================
   📊 SMOKE TEST RESULTS:
   ============================================================
   Database:     afi_eliza
   Collection:   demo_health
   Document ID:  507f1f77bcf86cd799439011
   Created At:   2024-01-15T10:30:00.000Z
   Note:         AFI gateway Mongo smoke test
   Version:      0.1.0
   ============================================================
   ✅ SMOKE TEST PASSED
   ```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB Atlas connection string |
| `AFI_MONGO_DB_NAME` | No | `afi_eliza` | Database name for gateway data |

### Usage in Code

```typescript
import { getDb, closeMongoConnection } from "./lib/db/mongo.js";

// Get database instance
const db = await getDb();

// Use a collection
const sessions = db.collection("sessions");
await sessions.insertOne({ userId: "123", createdAt: new Date() });

// Graceful shutdown
await closeMongoConnection();
```

---

## Safety Disclaimers

**IMPORTANT**: Custom characters built with this framework should follow these guidelines:

**Characters should NOT**:
- Provide financial advice or trade recommendations
- Guarantee returns, yields, or APY
- Execute transactions or sign contracts
- Access user funds or wallets
- Make promises about token prices or market outcomes

**Characters CAN**:
- Explain how AFI Protocol works (signal lifecycle, validators, governance)
- Help users understand AFI's intelligence outputs
- Point users to documentation and resources
- Act as a concierge into AFI tools (not the tool itself)

**User Responsibility**: Users are solely responsible for their own financial decisions. AFI Protocol provides intelligence, not advice.

---

## Directory Structure

```
afi-gateway/
├── src/
│   ├── index.ts                  # Gateway entrypoint (ElizaOS runtime)
│   ├── server-full.ts            # Full ElizaOS server with custom character support
│   ├── server.ts                 # Minimal HTTP server for health checks
│   ├── plugins/                  # AFI-specific Eliza plugins
│   ├── characters/               # Custom character configs (create your own here)
│   ├── clients/                  # HTTP/WS clients for AFI services
│   └── afiscout/                 # Example character (AFIScout)
├── docs/
│   └── CHARACTER_DEVELOPMENT.md  # Guide for creating custom characters
├── dist/                         # Compiled TypeScript output
├── package.json
├── tsconfig.json
├── .env                          # Environment variables (not committed)
├── README.md
└── AGENTS.md                     # Droid instructions
```

---

## Custom Character Development

This gateway is designed as a framework for community-driven character development. No pre-built characters are included.

**Getting Started**:

1. **Create a Character**: See `docs/CHARACTER_DEVELOPMENT.md` for detailed guides
2. **Use AFI Skills**: Characters can access AFI services through plugins
3. **Deploy**: Start your character using `src/server-full.ts`

**Example Character Structure**:

```typescript
import type { Character } from "@elizaos/core";

export const myCharacter: Character = {
  name: "MyCharacter",
  username: "mycharacter",
  bio: ["Your character description"],
  system: "Your character's system prompt...",
  plugins: ["@elizaos/plugin-bootstrap", "@afi/plugin-afi-reactor-actions"],
  // ... other character properties
};
```

**Skills Available**:
- Signal submission via AFI Reactor
- Health checks and telemetry
- Custom actions and evaluators
- Integration with AFI services

**See `docs/CHARACTER_DEVELOPMENT.md` for complete guides and examples.**

---

## Contributing

See `AGENTS.md` for droid-specific instructions and boundaries.

All changes must follow the AFI Droid Charter:
- `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`

---

## Contributing

See `AGENTS.md` for droid-specific instructions and boundaries.

All changes must follow the AFI Droid Charter:
- `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`

**Character Development**: See `docs/CHARACTER_DEVELOPMENT.md` for guides on creating custom characters.

## License

MIT
