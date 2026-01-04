# Character Development Guide

**afi-gateway Framework for Custom Character Development**

This guide explains how to create custom characters with skills using the afi-gateway framework. No pre-built characters are included—this is a framework for community-driven character development.

---

## Table of Contents

1. [Overview](#overview)
2. [Character Structure](#character-structure)
3. [Creating Your First Character](#creating-your-first-character)
4. [Skills System](#skills-system)
5. [AFI Integration](#afi-integration)
6. [Character Configuration](#character-configuration)
7. [Deploying Your Character](#deploying-your-character)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Overview

### What is a Character?

A character in the afi-gateway framework is an ElizaOS agent with:
- A unique personality and system prompt
- Access to AFI services through plugins
- Custom skills and actions
- Integration with multiple interfaces (Discord, Telegram, Web, CLI)

### Framework Benefits

- **Modular**: Mix and match plugins and skills
- **Extensible**: Add custom actions and evaluators
- **AFI-Integrated**: Access signal scoring, validation, and telemetry
- **Multi-Interface**: Deploy to Discord, Telegram, Web, or CLI

---

## Character Structure

### Basic Character File

Create a TypeScript file in `src/characters/your-character.ts`:

```typescript
import type { Character } from "@elizaos/core";

export const yourCharacter: Character = {
  name: "YourCharacter",
  username: "yourcharacter",
  
  bio: [
    "Brief description of your character",
    "What makes your character unique",
  ],
  
  system: `You are YourCharacter.

Your role and personality...
Your capabilities...
Your limitations...`,
  
  plugins: [
    "@elizaos/plugin-bootstrap",
    "@afi/plugin-afi-reactor-actions",
  ],
  
  style: {
    all: ["Style guidelines for all responses"],
    chat: ["Style guidelines for chat"],
    post: ["Style guidelines for posts"],
  },
  
  messageExamples: [
    [
      {
        name: "User",
        content: { text: "Example user message" },
      },
      {
        name: "YourCharacter",
        content: { text: "Example character response" },
      },
    ],
  ],
  
  settings: {
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 1000,
  },
};
```

---

## Creating Your First Character

### Step 1: Create Character File

```bash
# Create your character file
touch src/characters/my-character.ts
```

### Step 2: Define Character

```typescript
import type { Character } from "@elizaos/core";

export const myCharacter: Character = {
  name: "MyCharacter",
  username: "mycharacter",
  
  bio: [
    "A helpful assistant for AFI Protocol",
    "Explains signals and governance",
  ],
  
  system: `You are MyCharacter, a helpful assistant for AFI Protocol.

Your Mission:
- Help users understand AFI Protocol
- Explain signals, validators, and governance
- Provide clear, accurate information

Your Limits:
- Do NOT provide financial advice
- Do NOT guarantee returns or outcomes
- Always include appropriate disclaimers`,
  
  plugins: [
    "@elizaos/plugin-bootstrap",
    "@afi/plugin-afi-reactor-actions",
  ],
  
  style: {
    all: [
      "Be helpful and clear",
      "Use markdown formatting",
      "Include disclaimers when discussing financial topics",
    ],
  },
  
  settings: {
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 1000,
  },
};
```

### Step 3: Import and Start Character

Edit `src/server-full.ts`:

```typescript
import { myCharacter } from "./characters/my-character.js";

// In main():
await server.startAgent(myCharacter);
```

### Step 4: Run Your Character

```bash
# Start the server with your character
pnpm dev:server-full
```

---

## Skills System

### Available AFI Skills

Characters can access AFI services through plugins:

#### 1. Signal Submission

```typescript
// Character can submit signal drafts to AFI Reactor
// Action: SUBMIT_SIGNAL_DRAFT
// Plugin: @afi/plugin-afi-reactor-actions
```

**Usage**: Character can analyze market conditions and submit signal drafts for scoring.

#### 2. Health Checks

```typescript
// Character can check AFI Reactor health
// Action: CHECK_AFI_REACTOR_HEALTH
// Plugin: @afi/plugin-afi-reactor-actions
```

**Usage**: Character can verify AFI services are operational.

#### 3. Decision Explanation

```typescript
// Character can explain last signal decision
// Action: EXPLAIN_LAST_DECISION
// Plugin: @afi/plugin-afi-reactor-actions
```

**Usage**: Character can provide context about recent signal scoring.

#### 4. Enrichment Layers

```typescript
// Character can explain enrichment legos
// Action: DESCRIBE_ENRICHMENT_LAYERS
// Plugin: @afi/plugin-afi-reactor-actions
```

**Usage**: Character can educate users about AFI's enrichment system.

### Creating Custom Skills

You can create custom skills by adding actions to your character:

```typescript
import type { Action } from "@elizaos/core";

const myCustomAction: Action = {
  name: "MY_CUSTOM_ACTION",
  description: "Description of what this action does",
  similes: ["Alternative ways to describe this action"],
  
  validate: async (runtime, message) => {
    // Return true if action is valid for this message
    return true;
  },
  
  handler: async (runtime, message, state, options, callback) => {
    // Implement your custom logic here
    return {
      success: true,
      data: "Result of your action",
    };
  },
};

// Add to character plugins
export const myCharacter: Character = {
  // ... other properties
  plugins: [
    "@elizaos/plugin-bootstrap",
    {
      name: "my-custom-plugin",
      actions: [myCustomAction],
    },
  ],
};
```

---

## AFI Integration

### Environment Variables

Configure AFI integration in `.env`:

```bash
# OpenAI API Key (required for LLM)
OPENAI_API_KEY=sk-your-key-here

# AFI Reactor URL (optional, defaults to http://localhost:8080)
AFI_REACTOR_BASE_URL=http://localhost:8080

# MongoDB (optional, for session persistence)
MONGODB_URI=mongodb+srv://...
AFI_MONGO_DB_NAME=afi_eliza
```

### AFI Services Access

Characters can access AFI services through:

1. **HTTP/WS APIs**: Direct calls to afi-reactor and afi-core
2. **Plugins**: Pre-built actions for common AFI operations
3. **Client Libraries**: TypeScript clients from afi-core

### Example: Signal Submission

```typescript
// Character can submit signal drafts
const signalDraft = {
  symbol: "BTC/USDT",
  timeframe: "1h",
  strategy: "trend_pullback_v1",
  direction: "long",
  market: "spot",
  setupSummary: "Bullish pullback to 20 EMA...",
};

// Submit via AFI Reactor plugin
const result = await submitSignalDraft(signalDraft);
```

---

## Character Configuration

### System Prompt

The `system` property defines your character's personality and behavior:

```typescript
system: `You are YourCharacter.

# Your Identity
Who you are and what you do...

# Your Mission
Your primary goals and objectives...

# Your Knowledge
What you know and can explain...

# Your Personality
How you communicate and interact...

# Your Limits
What you cannot do...

# Safety Protocols
How to handle sensitive topics...`
```

### Plugins

Configure which plugins your character uses:

```typescript
plugins: [
  "@elizaos/plugin-bootstrap",      // Core ElizaOS functionality
  "@elizaos/plugin-node",           // Node.js services
  "@afi/plugin-afi-reactor-actions", // AFI-specific actions
  "@elizaos/plugin-discord",        // Discord integration
  "@elizaos/plugin-telegram",       // Telegram integration
  // Add custom plugins here
],
```

### Style Guidelines

Define how your character communicates:

```typescript
style: {
  all: [
    "Be warm and helpful",
    "Use clear, concise language",
    "Include appropriate disclaimers",
  ],
  chat: [
    "Keep responses under 1000 tokens",
    "Use markdown formatting",
    "Break complex topics into chunks",
  ],
  post: [
    "Maintain professional tone",
    "Focus on education",
  ],
},
```

### Message Examples

Provide example conversations for training:

```typescript
messageExamples: [
  [
    {
      name: "User",
      content: { text: "What is AFI?" },
    },
    {
      name: "YourCharacter",
      content: {
        text: "AFI Protocol is Agentic Financial Intelligence...",
      },
    },
  ],
  // Add more examples...
],
```

### Settings

Configure model and behavior:

```typescript
settings: {
  model: "gpt-4o",              // LLM model
  temperature: 0.7,               // Creativity (0-1)
  maxTokens: 1000,                // Response length
  
  // Discord-specific (if using Discord plugin)
  DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
  DISCORD_API_TOKEN: process.env.DISCORD_API_TOKEN,
  
  // Telegram-specific (if using Telegram plugin)
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
},
```

---

## Deploying Your Character

### Local Development

```bash
# Start with your character
pnpm dev:server-full

# Test via web UI
open http://localhost:8080

# Test via API
curl http://localhost:8080/api/agents
```

### Discord Integration

1. Create Discord bot at https://discord.com/developers/applications
2. Add credentials to `.env`:
   ```bash
   DISCORD_APPLICATION_ID=your_app_id
   DISCORD_API_TOKEN=your_bot_token
   ```
3. Add Discord plugin to character:
   ```typescript
   plugins: ["@elizaos/plugin-discord"],
   clients: ["discord"],
   ```
4. Start server and invite bot to your server

### Telegram Integration

1. Create Telegram bot via @BotFather
2. Add credentials to `.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token
   ```
3. Add Telegram plugin to character:
   ```typescript
   plugins: ["@elizaos/plugin-telegram"],
   clients: ["telegram"],
   ```
4. Start server and interact with bot

### Production Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Or deploy to Railway/other platforms
# Configure PORT environment variable
```

---

## Examples

### Example 1: Simple Assistant

```typescript
import type { Character } from "@elizaos/core";

export const simpleAssistant: Character = {
  name: "SimpleAssistant",
  username: "simpleassistant",
  
  bio: ["A simple helpful assistant"],
  
  system: `You are SimpleAssistant, a helpful assistant.
  
  Be concise and helpful. Answer questions clearly.`,
  
  plugins: ["@elizaos/plugin-bootstrap"],
  
  style: {
    all: ["Be helpful and concise"],
  },
  
  settings: {
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 500,
  },
};
```

### Example 2: AFI Signal Analyst

```typescript
import type { Character } from "@elizaos/core";

export const signalAnalyst: Character = {
  name: "SignalAnalyst",
  username: "signalanalyst",
  
  bio: [
    "Analyzes market signals using AFI Protocol",
    "Explains signal scoring and validation",
  ],
  
  system: `You are SignalAnalyst, an expert in AFI Protocol's signal processing.

Your Mission:
- Explain how AFI signals work
- Describe the signal lifecycle (Raw → Enriched → Analyzed → Scored)
- Help users understand signal scoring and validation

Your Limits:
- Do NOT provide financial advice
- Do NOT recommend specific trades
- Always include disclaimers`,
  
  plugins: [
    "@elizaos/plugin-bootstrap",
    "@afi/plugin-afi-reactor-actions",
  ],
  
  style: {
    all: [
      "Be technical but accessible",
      "Use clear explanations",
      "Include appropriate disclaimers",
    ],
  },
  
  messageExamples: [
    [
      {
        name: "User",
        content: { text: "How does AFI score signals?" },
      },
      {
        name: "SignalAnalyst",
        content: {
          text: "AFI scores signals through a multi-stage pipeline:\n\n1. **Raw**: Initial market data\n2. **Enriched**: Context added via enrichment legos\n3. **Analyzed**: Patterns detected\n4. **Scored**: Final UWR score assigned\n\nValidators then review and approve/reject signals based on quality and accuracy.\n\n**Note**: This is intelligence, not financial advice.",
        },
      },
    ],
  ],
  
  settings: {
    model: "gpt-4o",
    temperature: 0.6,
    maxTokens: 1000,
  },
};
```

### Example 3: Community Moderator

```typescript
import type { Character } from "@elizaos/core";

export const communityModerator: Character = {
  name: "CommunityModerator",
  username: "moderator",
  
  bio: [
    "Helps moderate community discussions",
    "Answers questions about AFI governance",
  ],
  
  system: `You are CommunityModerator, a helpful moderator for AFI Protocol.

Your Mission:
- Answer community questions about AFI
- Help users understand governance
- Point to official documentation
- Maintain a welcoming environment

Your Limits:
- Do NOT provide financial advice
- Do NOT make governance decisions
- Escalate complex issues to humans`,
  
  plugins: [
    "@elizaos/plugin-bootstrap",
    "@elizaos/plugin-discord",
  ],
  
  clients: ["discord"],
  
  style: {
    all: [
      "Be welcoming and patient",
      "Use accessible language",
      "Point to official docs",
    ],
  },
  
  settings: {
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 800,
    DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
    DISCORD_API_TOKEN: process.env.DISCORD_API_TOKEN,
  },
};
```

---

## Best Practices

### 1. Clear Boundaries

Always define what your character can and cannot do:

```typescript
system: `You are YourCharacter.

# Your Limits
You MUST NOT:
- Provide financial advice
- Guarantee returns or outcomes
- Execute transactions
- Access user funds

When asked outside scope, refuse clearly and redirect.`
```

### 2. Appropriate Disclaimers

Include disclaimers for sensitive topics:

```typescript
style: {
  all: [
    "Include disclaimers when discussing financial topics",
    "Separate facts from interpretations",
    "Admit when data is unavailable",
  ],
},
```

### 3. Consistent Personality

Maintain consistent communication style:

```typescript
style: {
  all: [
    "Be warm and professional",
    "Use clear, concise language",
    "Avoid hype and speculation",
  ],
},
```

### 4. Safety First

Prioritize user safety:

```typescript
system: `# Safety Protocols

- Include disclaimers naturally
- Separate facts from interpretations
- Escalate to humans when needed
- Never fabricate answers`
```

### 5. Testing

Test your character thoroughly:

```bash
# Type check
pnpm typecheck

# Run tests
pnpm test

# Test locally
pnpm dev:server-full
```

### 6. Documentation

Document your character:

```typescript
/**
 * YourCharacter
 *
 * Purpose: What this character does
 * Skills: What AFI services it uses
 * Interfaces: Where it can be deployed
 */
export const yourCharacter: Character = {
  // ...
};
```

---

## Resources

### Documentation

- [AFI Gateway README](../README.md)
- [AGENTS.md](../AGENTS.md)
- [AFI Agent Playbook](./AFI_AGENT_PLAYBOOK.v0.1.md)
- [AFI Agent Safety Checklist](./AFI_AGENT_SAFETY_CHECKLIST.v0.1.md)

### AFI Services

- [afi-reactor](../../afi-reactor/) - DAG orchestration
- [afi-core](../../afi-core/) - Validation and scoring
- [afi-config](../../afi-config/) - Governance and schemas

### ElizaOS

- [ElizaOS Documentation](https://docs.elizaos.com)
- [ElizaOS GitHub](https://github.com/elizaOS)

---

## Support

For questions or issues:
- Check existing documentation
- Review example characters
- Ask in AFI community channels
- Open an issue on GitHub

---

**Last Updated**: 2026-01-04 | **Framework Version**: 0.1.0
