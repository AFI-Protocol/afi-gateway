# AFI Community Agents — Quick Start Guide

Get Discord and Telegram bots running with AFI knowledge base in 15 minutes.

---

## Prerequisites

1. **Node.js 20+** installed
2. **OpenAI API Key** (for LLM and embeddings)
3. **Discord Bot Token** (for Discord bot)
4. **Telegram Bot Token** (for Telegram bot)

---

## Step 1: Install Dependencies

```bash
cd afi-gateway
npm install
```

This installs:
- `@elizaos/plugin-knowledge` - RAG system
- `@elizaos/plugin-discord` - Discord integration
- `@elizaos/plugin-telegram` - Telegram integration

---

## Step 2: Configure Environment

Create/update `.env` file:

```bash
# Required: OpenAI API key
OPENAI_API_KEY=sk-your-key-here

# Required for Discord bot
DISCORD_APPLICATION_ID=your_discord_app_id
DISCORD_API_TOKEN=your_discord_bot_token

# Required for Telegram bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Optional: Knowledge base settings
CTX_KNOWLEDGE_ENABLED=true
LOAD_DOCS_ON_STARTUP=true
```

### Getting Credentials

**Discord Bot**:
1. Go to https://discord.com/developers/applications
2. Create new application
3. Go to "Bot" section → Create bot
4. Copy `APPLICATION ID` and `TOKEN`

**Telegram Bot**:
1. Message @BotFather on Telegram
2. Use `/newbot` command
3. Follow prompts to create bot
4. Copy the bot token

---

## Step 3: Set Up Knowledge Hub

The knowledge hub is a **separate repository**. Set it up:

```bash
# Navigate to knowledge hub
cd ../afi-knowledge-hub

# Install dependencies
npm install

# Configure environment (create .env with OPENAI_API_KEY)
cp .env.example .env

# Run ingestion
npm run ingest
```

This will:
- Scan `afi-docs/` for specifications and guides
- Scan `afi-config/` for governance docs
- Scan `afi-reactor/` and `afi-core/` for architecture docs
- Process and embed all documents
- Store in vector database

**Expected output**:
```
🚀 Starting AFI Knowledge Hub Ingestion
✅ Knowledge plugin registered
📂 Processing Protocol specifications...
   ✅ mentor_protocol.md
   ✅ modal.md
   ...
📊 INGESTION SUMMARY
Total files found:     45
Successfully ingested: 42
Skipped/errors:        3
✅ Knowledge base ingestion complete!
```

**Important**: The knowledge hub and gateway must use the **same database** for the vector store. Configure both to point to the same database connection.

---

## Step 4: Start Discord Bot

```bash
npm run dev:discord
```

**Expected output**:
```
🚀 Starting AFI Discord Community Bot...
✅ Discord bot initialized
🤖 Phoenix is ready to help the community!
```

**Test it**:
1. Invite bot to your Discord server
2. Send message: "What is AFI Protocol?"
3. Bot should respond with knowledge base answer

---

## Step 5: Start Telegram Bot

```bash
npm run dev:telegram
```

**Expected output**:
```
🚀 Starting AFI Telegram Community Bot...
✅ Telegram bot initialized
🤖 Phoenix is ready to help the community!
```

**Test it**:
1. Find your bot on Telegram (search for the username you set)
2. Send message: "What is AFI Protocol?"
3. Bot should respond with knowledge base answer

---

## Troubleshooting

### Bot Not Responding

**Discord**:
- Check bot is invited to server with correct permissions
- Verify `DISCORD_APPLICATION_ID` and `DISCORD_API_TOKEN` are correct
- Check bot has "Read Messages" and "Send Messages" permissions

**Telegram**:
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Make sure you're messaging the bot directly (not in a group initially)

### Knowledge Base Empty

- Make sure `afi-knowledge-hub` ingestion completed successfully
- Verify both `afi-knowledge-hub` and `afi-gateway` use the same database
- Check that `afi-docs/` directory exists relative to `afi-knowledge-hub/`
- Re-run ingestion in `afi-knowledge-hub`: `cd ../afi-knowledge-hub && npm run ingest`

### OpenAI API Errors

- Verify `OPENAI_API_KEY` is set correctly
- Check API key has sufficient credits
- Ensure key has access to `text-embedding-3-small` model

---

## Next Steps

1. **Customize Character**: Edit `src/community/discord-phoenix.character.ts` or `telegram-phoenix.character.ts`
2. **Add More Knowledge**: Run `npm run ingest:knowledge` after adding new docs
3. **Monitor Usage**: Track common questions and update FAQ
4. **Deploy**: Use PM2, Docker, or cloud hosting for production

---

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start Discord bot
pm2 start npm --name "afi-discord" -- run dev:discord

# Start Telegram bot
pm2 start npm --name "afi-telegram" -- run dev:telegram

# Save PM2 config
pm2 save
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "dev:discord"]
```

---

## Cost Estimates

**Monthly costs** (approximate):
- **Small community** (< 1000 users): $10-50/month
- **Medium community** (1000-5000 users): $50-200/month
- **Large community** (> 5000 users): $200-500/month

**Cost breakdown**:
- OpenAI API (LLM + embeddings): ~90% of cost
- Vector storage: Minimal (uses existing database)
- Infrastructure: Varies by hosting

---

## Resources

- [Full Implementation Plan](./COMMUNITY_AGENTS_PLAN.md)
- [ElizaOS Knowledge Plugin Docs](https://docs.elizaos.ai/plugins/knowledge)
- [Discord Plugin Docs](https://docs.elizaos.ai/plugins/discord)
- [Telegram Plugin Docs](https://docs.elizaos.ai/plugins/telegram)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Full Implementation Plan](./COMMUNITY_AGENTS_PLAN.md)
3. Check ElizaOS documentation
4. Open an issue in the AFI repository

