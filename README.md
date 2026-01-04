# afi-gateway

**AFI's Universal Gateway**

This repository is AFI's universal gateway for multiple interfaces and integrations. It acts as an external client that calls AFI services over HTTP/WebSocket APIs.

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
│  afi-gateway (this repo)            │
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
- Gateway (this repo) → **depends on** → AFI services
- AFI services → **never depend on** → Gateway

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
# CLI mode (interactive terminal with Phoenix)
pnpm dev
# Runs: tsx src/index.ts
# Provides: AFI> CLI prompt for chatting with Phoenix

# HTTP server mode (minimal Express server)
pnpm dev:server
# Runs: tsx src/server.ts
# Provides: /healthz, /demo/ping endpoints on port 8080

# Full ElizaOS server mode (recommended for web client)
pnpm dev:server-full
# Runs: tsx src/server-full.ts
# Provides: Full ElizaOS API with all agents on port 8080
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
- **Local development with CLI**: `pnpm dev` (talk to Phoenix in terminal)
- **Testing HTTP endpoints**: `pnpm dev:server-full` (full ElizaOS API)
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
- **GET /api/agents** — List all available agents (Phoenix, Alpha, Froggy, Pixel Rick, Val Dook)
  ```bash
  curl http://localhost:8080/api/agents
  ```
- **POST /api/agents/:id/message** — Send a message to a specific agent
  ```bash
  curl -X POST http://localhost:8080/api/agents/AGENT_ID/message \
    -H "Content-Type: application/json" \
    -d '{"text": "Hello Phoenix!", "userId": "user123"}'
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

- ✅ Chat/session history for Phoenix & friends
- ✅ Local/demo data (e.g., healthcheck collection)
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

## Prize Pipeline Demo — "Pipeline with Friends"

**Status**: Ready for ElizaOS team demo
**Purpose**: Demonstrate AFI's signal processing pipeline using Phoenix, Alpha, and Val Dook personas

See **[PRIZE_DEMO.md](./PRIZE_DEMO.md)** for the full demo script.

### Quick Start

1. **Start AFI Reactor** (backend):
   ```bash
   cd /Users/secretservice/AFI_Modular_Repos/afi-reactor
   npm run dev
   # Should start on http://localhost:8080
   ```

2. **Start AFI Gateway** (agent runtime):
   ```bash
   cd /Users/secretservice/AFI_Modular_Repos/afi-eliza-gateway
   npm run dev
   # Starts ElizaOS runtime with Phoenix, Alpha, and Val Dook characters
   ```

3. **Run the demo** (via Phoenix):
   - **User**: "Phoenix, run the prize demo"
   - **Phoenix**: [calls `RUN_PRIZE_DEMO` action and presents narrative summary]

The demo runs a pre-configured BTC trend-pullback signal through the 6-stage Froggy pipeline and shows how Phoenix (narrator), Alpha (scout), and Val Dook (validator) work together.

**DEMO-ONLY**: No real trading, no AFI minting, simulated execution only.

---

### AFIScout Smoke Test

AFIScout is an ElizaOS character that turns natural-language trade ideas into AFI-ready **draft** signal payloads (no PoI/PoInsight/UWR/Novelty/emissions/tokenomics). The smoke script runs locally with an in-memory runtime (no DB, no backends) and logs a single draft JSON.

```bash
npm run afiscout:smoke
```

What it does:
- Creates a minimal AgentRuntime with AFIScout only.
- Feeds a sample trade idea to AFIScout.
- Invokes the `emitAfiSignalDraft` action once and logs the resulting `AfiScoutSignalDraft` to stdout.

Boundaries:
- Local demo/debug only; it does NOT send anything to AFI or any external service.
- Draft-only outbox; no validation, scoring, tokenomics, or vault writes.

See `docs/AFI_SIGNAL_OUTBOX_README.md` for a conceptual view of how these drafts could be forwarded into AFI in the future.
```

---

## Safety Disclaimers

**IMPORTANT**: Phoenix is an educational and informational agent. It does NOT:

- Provide financial advice or trade recommendations
- Guarantee returns, yields, or APY
- Execute transactions or sign contracts
- Access user funds or wallets
- Make promises about token prices or market outcomes

**What Phoenix DOES**:

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
│   ├── phoenix.character.ts      # Phoenix character definition
│   ├── plugins/                  # AFI-specific Eliza plugins (future)
│   ├── characters/               # Additional character configs (future)
│   └── clients/                  # HTTP/WS clients for AFI services (future)
├── dist/                         # Compiled TypeScript output
├── package.json
├── tsconfig.json
├── .env                          # Environment variables (not committed)
├── README.md
└── AGENTS.md                     # Droid instructions
```

---

## Phoenix Character

Phoenix is AFI Protocol's frontline agent and primary human-facing voice.

**Governance Documentation**:
- Persona specification: `afi-config/codex/governance/agents/PHOENIX_PERSONA.v0.1.md`
- Agent universe context: `afi-config/codex/governance/agents/AFI_AGENT_UNIVERSE.v0.1.md`

**Character File**: `src/phoenix.character.ts`

**Key Characteristics**:
- Warm, technically fluent, and clear communication style
- Explains AFI's "financial brain" in plain language
- Acts as a concierge into AFI tools, not the tool itself
- Respects hard boundaries: NO financial advice, NO guarantees, NO raw data exposure

**Interfaces** (current and planned):
- Discord (primary, when Discord credentials are configured)
- Web chat (future)
- CLI (future)

---

## Contributing

See `AGENTS.md` for droid-specific instructions and boundaries.

All changes must follow the AFI Droid Charter:
- `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`

---

## License

MIT
