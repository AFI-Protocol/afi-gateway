# AFI Eliza Gateway — HTTP Server

## Overview

This repository now includes a **production-ready HTTP server** for deploying AFI Eliza Gateway as a long-running service on Railway or similar platforms.

## Server Entrypoint

**File:** `src/server.ts`

This is a minimal Express-based HTTP server that provides:
- Health check endpoint (`/healthz`)
- Demo ping endpoint (`/demo/ping`)
- Railway-ready configuration (PORT-based, 0.0.0.0 binding)

## Local Development

### Install Dependencies

```bash
npm install
```

### Run HTTP Server (Development Mode)

```bash
npm run dev:server
```

This starts the HTTP server using `tsx` (no build required).

**Expected output:**
```
🚀 AFI ELIZA GATEWAY — HTTP SERVER
   Listening on http://0.0.0.0:8080
   Environment: development
   Version: 0.1.0

   Available Routes:
     GET  /healthz       — Health check
     GET  /demo/ping     — Ping endpoint
```

### Run CLI Interface (Original Behavior)

```bash
npm run dev
```

This starts the original CLI-based ElizaOS runtime with readline interface.

## Production Deployment

### Build

```bash
npm run build
```

This compiles TypeScript to `dist/` using `tsc`.

### Start HTTP Server (Production Mode)

```bash
npm run start
```

This runs the compiled HTTP server from `dist/server.js`.

### Start CLI (Production Mode)

```bash
npm run start:cli
```

This runs the compiled CLI interface from `dist/index.js`.

## Railway Deployment

This repository is **Railway-ready** out of the box.

### Requirements

1. **PORT Environment Variable:** Railway automatically sets `PORT`. The server reads this and binds to `0.0.0.0:$PORT`.

2. **Build Command:** Railway will automatically run `npm install && npm run build`.

3. **Start Command:** Railway will automatically run `npm run start` (which starts the HTTP server).

### Health Check

Railway can monitor the service using:
```
GET /healthz
```

Expected response:
```json
{
  "status": "ok",
  "service": "afi-gateway",
  "timestamp": "2025-12-07T12:34:56.789Z",
  "version": "0.1.0",
  "environment": "production"
}
```

## Environment Variables

### Required for HTTP Server

- **PORT** (default: 8080) — HTTP server port

### Optional

- **NODE_ENV** (default: development) — Environment mode
- **OPENAI_API_KEY** — OpenAI API key (not required for health checks)
- **AFI_REACTOR_BASE_URL** — AFI Reactor API URL (for future integration)

## Testing Locally

### Test Health Check

```bash
curl -s http://localhost:8080/healthz | jq
```

### Test Ping Endpoint

```bash
curl -s http://localhost:8080/demo/ping | jq
```

## Architecture Notes

- **HTTP Server** (`src/server.ts`) — Stateless HTTP API wrapper
- **CLI Interface** (`src/index.ts`) — Interactive readline-based runtime
- **No Breaking Changes** — Both modes coexist; CLI is still available via `npm run dev` or `npm run start:cli`

## Future Enhancements

- Add ElizaOS agent runtime to HTTP server (currently HTTP-only)
- Add WebSocket support for real-time chat
- Add `/agents` and `/agents/:id/messages` endpoints for web client integration
- Add authentication/authorization middleware

---

**For questions or issues, see the main README.md or contact the AFI Protocol team.**

