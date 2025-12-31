# AFI Community Agents — Implementation Plan

**Goal**: Deploy Discord and Telegram bots that can answer community questions about AFI Protocol using the centralized knowledge hub.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  AFI Community Agents (afi-eliza-gateway)                 │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │ Discord Bot  │  │ Telegram Bot │                      │
│  └──────┬───────┘  └──────┬───────┘                      │
│         │                  │                              │
│         └────────┬─────────┘                              │
│                  │                                        │
│         ┌────────▼─────────┐                             │
│         │  ElizaOS Runtime  │                             │
│         │  - Phoenix Agent  │                             │
│         │  - Knowledge Plugin│                             │
│         └────────┬───────────┘                             │
│                  │                                        │
│                  │ (queries via Knowledge plugin)        │
│                  ▼                                        │
┌─────────────────────────────────────────────────────────┐
│  AFI Knowledge Hub (afi-knowledge-hub)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Vector Store (embeddings)                       │   │
│  │  - AFI Docs (specs, guides)                      │   │
│  │  - Governance (codex)                            │   │
│  │  - Architecture (reactor, core)                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                  │                  │
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ afi-docs     │  │ afi-config  │  │ afi-reactor  │
│ (source)     │  │ (source)    │  │ (source)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Key Separation**:
- **afi-knowledge-hub**: Ingests docs, manages vector store, provides query interface
- **afi-eliza-gateway**: Agents consume knowledge hub via Knowledge plugin
- **afi-docs/afi-config/etc.**: Source documentation (not processed here)

---

## Implementation Steps

### Phase 1: Knowledge Base Setup

#### 1.1 Identify Documentation Sources

**Primary Sources** (from `afi-docs`):
- `specs/` - Protocol specifications
- `guides/` - Developer guides
- `lore/` - Signal-Lore narratives

**Secondary Sources**:
- `afi-config/codex/governance/` - Governance docs
- `afi-reactor/README.md` - Pipeline docs
- `afi-core/README.md` - Core runtime docs
- `afi-eliza-gateway/docs/` - Gateway docs

#### 1.2 Knowledge Base Structure

```
afi-community-agents/
├── knowledge/
│   ├── afi-protocol/          # Protocol specs
│   ├── governance/             # Governance docs
│   ├── architecture/          # Architecture docs
│   ├── guides/                # Developer guides
│   └── faq/                   # Community FAQ
└── agents/
    ├── discord-phoenix.ts     # Discord bot character
    └── telegram-phoenix.ts    # Telegram bot character
```

---

### Phase 2: Character Configuration

#### 2.1 Community-Facing Phoenix Character

**Key Differences from Internal Phoenix**:
- More accessible language (less technical jargon)
- Focus on community onboarding
- Emphasis on safety disclaimers
- Can't access internal AFI services (read-only knowledge)

#### 2.2 Character Traits

```typescript
{
  name: "Phoenix",
  bio: [
    "AFI Protocol community assistant",
    "Answers questions about AFI using our knowledge base",
    "Helps onboard new community members",
    "Explains protocol architecture and governance",
    "Does NOT provide financial advice"
  ],
  system: `You are Phoenix, AFI Protocol's community assistant.
  
  Your role:
  - Answer questions about AFI Protocol using the knowledge base
  - Help new members understand how AFI works
  - Explain governance, architecture, and signal flow
  - Point users to official documentation
  
  You MUST:
  - Always cite sources from knowledge base
  - Include safety disclaimers when discussing financial topics
  - Admit when you don't know something
  - Never provide financial advice or trading recommendations
  
  You CANNOT:
  - Access live AFI services or pipelines
  - Provide real-time signal data
  - Execute transactions or sign contracts
  - Guarantee returns or outcomes`
}
```

---

### Phase 3: Plugin Configuration

#### 3.1 Required Plugins

```typescript
const communityPlugins = [
  "@elizaos/plugin-bootstrap",      // Core actions
  "@elizaos/plugin-knowledge",      // RAG system ⭐
  "@elizaos/plugin-discord",        // Discord integration
  "@elizaos/plugin-telegram",       // Telegram integration
  "@elizaos/plugin-node",           // Node.js services
];
```

#### 3.2 Knowledge Plugin Configuration

```typescript
settings: {
  // Knowledge plugin settings
  CTX_KNOWLEDGE_ENABLED: true,
  LOAD_DOCS_ON_STARTUP: true,
  MAX_INPUT_TOKENS: 4000,
  EMBEDDING_PROVIDER: "openai",
  TEXT_EMBEDDING_MODEL: "text-embedding-3-small",
  
  // Platform credentials
  DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
  DISCORD_API_TOKEN: process.env.DISCORD_API_TOKEN,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  
  // OpenAI for LLM
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
}
```

---

### Phase 4: Knowledge Hub Setup

#### 4.1 Set Up afi-knowledge-hub Repository

The knowledge hub is a **separate repository** (`afi-knowledge-hub`) that:
- Ingests documentation from source repos
- Processes documents into embeddings
- Manages the vector store
- Provides query interface

**Setup Steps**:

1. **Clone/Create afi-knowledge-hub**:
   ```bash
   cd ../afi-knowledge-hub
   npm install
   ```

2. **Configure knowledge sources**:
   Edit `config/sources.json` to point to:
   - `../afi-docs/specs`
   - `../afi-docs/guides`
   - `../afi-config/codex/governance`
   - `../afi-reactor` (README, docs)
   - `../afi-core` (README, docs)

3. **Run ingestion**:
   ```bash
   npm run ingest
   ```

This populates the vector store that agents will query.

#### 4.2 Knowledge Sources Priority

1. **High Priority** (ingest first):
   - `afi-docs/specs/mentor_protocol.md`
   - `afi-docs/guides/validator.md`
   - `afi-config/codex/governance/agents/PHOENIX_PERSONA.v0.1.md`
   - `afi-reactor/README.md`

2. **Medium Priority**:
   - All other specs and guides
   - Architecture documentation
   - Governance docs

3. **Low Priority**:
   - Lore/narrative content
   - Example files
   - Internal development docs

---

### Phase 5: Deployment

#### 5.1 Discord Bot Setup

1. **Create Discord Application**:
   - Go to https://discord.com/developers/applications
   - Create new application
   - Get `DISCORD_APPLICATION_ID` and `DISCORD_API_TOKEN`
   - Set bot permissions (Read Messages, Send Messages, Embed Links)

2. **Invite Bot to Server**:
   - Use OAuth2 URL generator
   - Select bot scope and required permissions
   - Add bot to your Discord server

3. **Configure Character**:
   ```typescript
   export const discordPhoenix: Character = {
     ...phoenixCharacter,
     plugins: [
       ...communityPlugins,
       // Discord-specific settings
     ],
     clients: ["discord"],
     settings: {
       ...phoenixCharacter.settings,
       DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
       DISCORD_API_TOKEN: process.env.DISCORD_API_TOKEN,
       // Optional: restrict to specific channels
       DISCORD_ALLOWED_CHANNEL_IDS: process.env.DISCORD_ALLOWED_CHANNEL_IDS?.split(","),
     }
   };
   ```

#### 5.2 Telegram Bot Setup

1. **Create Telegram Bot**:
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Get `TELEGRAM_BOT_TOKEN`

2. **Configure Character**:
   ```typescript
   export const telegramPhoenix: Character = {
     ...phoenixCharacter,
     plugins: [
       ...communityPlugins,
       // Telegram-specific settings
     ],
     clients: ["telegram"],
     settings: {
       ...phoenixCharacter.settings,
       TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
     }
   };
   ```

---

## Knowledge Base Content Strategy

### Recommended Documents to Ingest

#### Core Protocol Docs
- ✅ `afi-docs/specs/mentor_protocol.md` - Mentor protocol
- ✅ `afi-docs/specs/modal.md` - Modal testbed
- ✅ `afi-docs/specs/novelty_spec.v0.1.md` - Novelty contract
- ✅ `afi-docs/guides/validator.md` - Validator onboarding

#### Governance
- ✅ `afi-config/codex/governance/agents/PHOENIX_PERSONA.v0.1.md`
- ✅ `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`
- ✅ `afi-config/codex/governance/agents/AFI_AGENT_UNIVERSE.v0.1.md`

#### Architecture
- ✅ `afi-reactor/README.md` - Pipeline orchestration
- ✅ `afi-core/README.md` - Core runtime
- ✅ `afi-eliza-gateway/README.md` - Gateway overview

#### Community FAQ
Create a `knowledge/faq/` directory with common questions:
- "What is AFI Protocol?"
- "How do signals flow through the pipeline?"
- "What is a validator?"
- "How do I become a validator?"
- "What is PoI and PoInsight?"

---

## Testing Strategy

### 1. Knowledge Base Testing

```typescript
// Test knowledge retrieval
const testQueries = [
  "What is AFI Protocol?",
  "How do I become a validator?",
  "What is the signal lifecycle?",
  "Explain PoI and PoInsight",
];

for (const query of testQueries) {
  const results = await knowledgeService.getKnowledge({
    content: { text: query }
  });
  console.log(`Query: ${query}`);
  console.log(`Results: ${results.length} found`);
}
```

### 2. Bot Response Testing

- Test in private Discord channel first
- Test in Telegram private chat
- Verify knowledge citations are included
- Check safety disclaimers appear when needed

---

## Maintenance

### Regular Updates

1. **Weekly**: Check for new documentation
2. **Monthly**: Re-ingest updated docs
3. **Quarterly**: Review and prune outdated knowledge

### Monitoring

- Track common questions (add to FAQ)
- Monitor response quality
- Update knowledge base based on gaps

---

## Cost Considerations

### Knowledge Plugin Costs

- **Embedding Generation**: ~$0.0001 per 1K tokens
- **Vector Storage**: Minimal (uses existing database)
- **Query Processing**: Included in LLM costs

### Estimated Monthly Costs

- **Small Community** (< 1000 users): ~$10-50/month
- **Medium Community** (1000-5000 users): ~$50-200/month
- **Large Community** (> 5000 users): ~$200-500/month

---

## Next Steps

1. ✅ Create character configs for Discord/Telegram
2. ✅ Set up knowledge ingestion script
3. ✅ Ingest initial documentation
4. ✅ Deploy Discord bot (test server first)
5. ✅ Deploy Telegram bot (private chat first)
6. ✅ Monitor and iterate

---

## Resources

- [ElizaOS Knowledge Plugin Docs](https://docs.elizaos.ai/plugins/knowledge)
- [Discord Plugin Docs](https://docs.elizaos.ai/plugins/discord)
- [Telegram Plugin Docs](https://docs.elizaos.ai/plugins/telegram)
- [AFI Documentation](https://github.com/AFI-Protocol/afi-docs)

