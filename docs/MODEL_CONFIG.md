# AFI Eliza Gateway — OpenAI Model Configuration

## Overview

AFI Eliza Gateway uses OpenAI's API for all agent conversations and intelligence. This document explains how model providers are configured and how to troubleshoot common issues.

---

## Model Provider Architecture

### How It Works

1. **Custom Plugin**: `plugins/afi-openai-models/index.ts` provides OpenAI model handlers
2. **Model Types Supported**:
   - `TEXT_LARGE` — Main conversation model (gpt-4o by default)
   - `TEXT_SMALL` — Quick tasks, structured output (gpt-4o-mini)
   - `TEXT_EMBEDDING` — Vector embeddings (text-embedding-3-small)
   - `IMAGE_DESCRIPTION` — Vision/image understanding (gpt-4o)

3. **Plugin Registration**: The plugin is loaded in `src/server-full.ts` as part of `basePlugins`

### Why a Custom Plugin?

ElizaOS 1.6.4 does **not** include a built-in `@elizaos/plugin-openai` package. Model providers must be registered through plugins. Our custom `afi-openai-models` plugin fills this gap by:
- Registering OpenAI model handlers for all required model types
- Using the `openai` npm package to call OpenAI's API
- Respecting character settings (model, temperature, maxTokens)

---

## Configuration

### Required Environment Variable

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Where to get it**: [OpenAI API Keys](https://platform.openai.com/api-keys)

### Character Settings

Each character can override model settings in their character file (e.g., `src/phoenix.character.ts`):

```typescript
settings: {
  model: "gpt-4o",           // OpenAI model to use
  temperature: 0.65,         // Creativity (0.0 = deterministic, 1.0 = creative)
  maxTokens: 1000,           // Max response length
}
```

**Supported Models**:
- `gpt-4o` — Latest GPT-4 Omni (recommended for main conversations)
- `gpt-4o-mini` — Faster, cheaper variant (used for TEXT_SMALL)
- `gpt-4-turbo` — Previous generation GPT-4
- `gpt-3.5-turbo` — Older, cheaper model

---

## Troubleshooting

### Error: "No handler found for delegate type: TEXT_LARGE"

**Cause**: The OpenAI models plugin is not loaded or failed to initialize.

**Fix**:
1. Verify `afiOpenAIModelsPlugin` is in `basePlugins` array in `src/server-full.ts`
2. Check that `OPENAI_API_KEY` is set in `.env`
3. Restart the server: `npm run dev:server-full`

### Error: "OPENAI_API_KEY environment variable is required"

**Cause**: Missing or empty `OPENAI_API_KEY` in `.env`

**Fix**:
1. Copy `.env.example` to `.env`: `cp .env.example .env`
2. Add your OpenAI API key to `.env`
3. Restart the server

### Warning: "Failed to load plugin @elizaos/plugin-node"

**Cause**: Version incompatibility between `@elizaos/plugin-node` and `@elizaos/core`

**Impact**: Node.js services (browser, PDF, speech) won't work, but OpenAI models will still function

**Fix**: This is a known issue with ElizaOS 1.6.4. The plugin is optional for basic conversation.

---

## Plugin Code Reference

The OpenAI models plugin is located at:
```
afi-eliza-gateway/plugins/afi-openai-models/index.ts
```

**Key Functions**:
- `textLargeHandler` — Handles main conversation (uses character's model setting)
- `textSmallHandler` — Handles quick tasks (uses gpt-4o-mini)
- `textEmbeddingHandler` — Generates vector embeddings
- `imageDescriptionHandler` — Describes images using vision

---

## Cost Optimization

### Model Selection

- **gpt-4o**: ~$5/1M input tokens, ~$15/1M output tokens
- **gpt-4o-mini**: ~$0.15/1M input tokens, ~$0.60/1M output tokens
- **text-embedding-3-small**: ~$0.02/1M tokens

### Tips

1. Use `gpt-4o-mini` for simple tasks (already configured for TEXT_SMALL)
2. Reduce `maxTokens` in character settings to limit response length
3. Increase `temperature` slightly (0.7-0.8) to reduce repetitive responses
4. Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

---

## Future Enhancements

Potential improvements to the model provider system:

1. **Multi-Provider Support**: Add Anthropic Claude, Google Gemini, etc.
2. **Model Fallback**: Automatically retry with cheaper model if primary fails
3. **Caching**: Cache embeddings and common responses
4. **Rate Limiting**: Implement request throttling to avoid API limits

---

## Related Documentation

- [ElizaOS Plugin System](https://github.com/elizaos/eliza/blob/main/docs/plugins.md)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [AFI Reactor Actions Plugin](../plugins/afi-reactor-actions/README.md)

