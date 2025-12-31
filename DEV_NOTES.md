# AFI Eliza Gateway — Developer Quick Reference

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Run in dev mode
pnpm dev:server-full
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key (must start with `sk-`) |
| `PORT` | No | `8080` | HTTP server port |
| `AFI_REACTOR_BASE_URL` | No | `http://localhost:8080` | AFI Reactor API URL |
| `MONGODB_URI` | No | - | MongoDB connection string (gateway data only) |
| `AFI_MONGO_DB_NAME` | No | `afi_eliza` | MongoDB database name |
| `NODE_ENV` | No | `development` | Environment mode |

## Development Commands

```bash
# CLI mode (interactive terminal)
pnpm dev

# HTTP server (minimal Express)
pnpm dev:server

# Full ElizaOS server (recommended)
pnpm dev:server-full

# Build TypeScript
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## HTTP Endpoints (Full Server Mode)

**Port:** 8080 (default)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | ElizaOS Web UI (interactive chat) |
| GET | `/health` | ElizaOS health check with agent status |
| GET | `/api/agents` | List all agents (Phoenix, Alpha, Froggy, Pixel Rick, Val Dook) |
| POST | `/api/agents/:id/message` | Send message to agent |
| GET | `/api/agents/:id/rooms` | List rooms for agent |
| WS | `ws://localhost:8080/` | WebSocket for real-time chat |

## Testing Endpoints

```bash
# Open web UI in browser
open http://localhost:8080/

# Health check (JSON)
curl http://localhost:8080/health

# List all agents
curl http://localhost:8080/api/agents

# Get Phoenix's ID
PHOENIX_ID=$(curl -s http://localhost:8080/api/agents | jq -r '.data.agents[] | select(.name=="Phoenix") | .id')

# Send message to Phoenix
curl -X POST http://localhost:8080/api/agents/$PHOENIX_ID/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello Phoenix!", "userId": "dev-user"}'
```

## OpenAI Configuration

### Required Permissions
Your OpenAI API key must have these scopes:
- `model.request` (for chat completions)
- `model.read` (for model access)

### Expected Models
- **TEXT_LARGE**: `gpt-4o`, `gpt-4.1`, `gpt-5.1`
- **TEXT_SMALL**: `gpt-4o-mini`
- **TEXT_EMBEDDING**: `text-embedding-3-small`
- **IMAGE_DESCRIPTION**: `gpt-4o` (vision)

### Troubleshooting 401 Errors

If you see `AuthenticationError: 401 You have insufficient permissions`:

1. Go to https://platform.openai.com/api-keys
2. Check your key's permissions (should be "All" or include `model.request`)
3. If using a project-scoped key, verify project settings
4. Consider creating a new key with full permissions
5. Wait a few minutes after updating permissions (API may cache old settings)

**This is NOT a code bug** — it's an OpenAI account/key configuration issue.

## Available Agents

- **Phoenix** — Host/narrator, AFI Protocol explainer
- **Alpha** — Scout, signal submitter
- **Froggy** — Analyst, strategy brain
- **Pixel Rick** — Enrichment architect, context builder
- **Val Dook** — Validator, judge

## Common Issues

### Port Already in Use
```bash
# Check what's using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### OpenAI Key Not Found
```bash
# Verify .env file exists
ls -la .env

# Check key is set
grep OPENAI_API_KEY .env
```

### MongoDB Connection Issues
MongoDB is **optional** for basic functionality. The gateway will work without it.
Only needed for persistent chat history and session storage.

## Architecture Notes

- **ElizaOS Server**: Uses `@elizaos/server` (AgentServer class)
- **Custom Routes**: Added via `server.app` after initialization
- **OpenAI Plugin**: Custom AFI plugin at `plugins/afi-openai-models/`
- **Error Handling**: Detailed logging for 401/403 errors, compact for subsequent failures

## File Structure

```
afi-eliza-gateway/
├── src/
│   ├── index.ts              # CLI mode entrypoint
│   ├── server.ts             # Minimal HTTP server
│   ├── server-full.ts        # Full ElizaOS server (recommended)
│   ├── config/env.ts         # Environment validation
│   ├── phoenix.character.ts  # Phoenix character config
│   └── ...
├── plugins/
│   ├── afi-openai-models/    # OpenAI model providers
│   ├── afi-reactor-actions/  # AFI Reactor integration
│   └── afi-telemetry/        # Telemetry plugin
└── ...
```

## Next Steps

- See [README.md](./README.md) for full documentation
- See [PRIZE_DEMO.md](./PRIZE_DEMO.md) for demo walkthrough
- See [AGENTS.md](./AGENTS.md) for droid instructions

