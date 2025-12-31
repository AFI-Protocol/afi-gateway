#!/bin/bash
# Start the server with a clean environment (no inherited OPENAI_API_KEY)
unset OPENAI_API_KEY
cd "$(dirname "$0")"
pnpm dev:server-full

