/**
 * AFI OpenAI Models Plugin
 *
 * Provides OpenAI model providers for TEXT_LARGE, TEXT_SMALL, TEXT_EMBEDDING, and IMAGE_DESCRIPTION.
 * This plugin registers model handlers that use the OpenAI API.
 *
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key (loaded and validated by src/config/env.ts)
 *
 * Expected Models:
 * - TEXT_LARGE: gpt-4o, gpt-4.1, gpt-5.1 (main conversation, complex reasoning)
 * - TEXT_SMALL: gpt-4o-mini (quick tasks, structured output)
 * - TEXT_EMBEDDING: text-embedding-3-small (vector embeddings)
 * - IMAGE_DESCRIPTION: gpt-4o (vision/image understanding)
 *
 * SECURITY: This plugin uses the centralized env config which ensures:
 * - API key is validated at startup
 * - Only the last 4 characters are logged for debugging
 * - No hardcoded keys anywhere in the codebase
 *
 * Error Handling:
 * - 401/403 errors are logged with actionable guidance (check API key scopes/permissions)
 * - Detailed errors are logged once, then compact messages for subsequent failures
 * - All OpenAI API calls are wrapped in try-catch blocks
 */

import { Plugin, type IAgentRuntime } from "@elizaos/core";
import OpenAI from "openai";
import { env } from "../../src/config/env.js";

/**
 * Track error counts to avoid log spam
 */
const errorCounts = {
  textLarge: 0,
  textSmall: 0,
  textEmbedding: 0,
  imageDescription: 0,
};

/**
 * Log OpenAI API errors with actionable guidance
 */
function logOpenAIError(handler: string, error: any, isFirstError: boolean): void {
  const errorMessage = error?.message || String(error);
  const statusCode = error?.status || error?.statusCode;

  if (statusCode === 401 || statusCode === 403 || errorMessage.includes("insufficient permissions")) {
    if (isFirstError) {
      console.error(`\n${"=".repeat(80)}`);
      console.error(`❌ OpenAI API Error in ${handler}`);
      console.error(`${"=".repeat(80)}`);
      console.error(`Status: ${statusCode || "Unknown"}`);
      console.error(`Message: ${errorMessage}`);
      console.error(``);
      console.error(`🔧 LIKELY CAUSE: OpenAI API key permissions issue`);
      console.error(``);
      console.error(`Your API key may be missing required scopes or permissions.`);
      console.error(`This is NOT a coding bug - it's an account/key configuration issue.`);
      console.error(``);
      console.error(`📋 ACTION REQUIRED:`);
      console.error(`   1. Go to: https://platform.openai.com/api-keys`);
      console.error(`   2. Check your API key's permissions and scopes`);
      console.error(`   3. Ensure the key has "All" permissions or at least:`);
      console.error(`      - model.request (for chat completions)`);
      console.error(`      - model.read (for model access)`);
      console.error(`   4. If using a project-scoped key, verify the project settings`);
      console.error(`   5. Consider creating a new key with full permissions`);
      console.error(``);
      console.error(`Current key ends with: ${env.openaiKeyDebug}`);
      console.error(`${"=".repeat(80)}\n`);
    } else {
      console.error(`❌ OpenAI API Error in ${handler}: ${errorMessage} (error #${errorCounts[handler as keyof typeof errorCounts]})`);
    }
  } else {
    // Other errors (rate limits, network issues, etc.)
    if (isFirstError) {
      console.error(`❌ OpenAI API Error in ${handler}:`, errorMessage);
      if (error?.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(`❌ OpenAI API Error in ${handler}: ${errorMessage}`);
    }
  }
}

// Initialize OpenAI client using centralized config
// This ensures we always use the validated OPENAI_API_KEY from env
const getOpenAIClient = () => {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
};

// TEXT_LARGE handler (for main conversation, complex reasoning)
const textLargeHandler = async (runtime: IAgentRuntime, params: any) => {
  try {
    const client = getOpenAIClient();
    const model = runtime.character?.settings?.model || "gpt-4o";

    const response = await client.chat.completions.create({
      model,
      messages: params.messages || [{ role: "user", content: params.prompt }],
      temperature: params.temperature ?? runtime.character?.settings?.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? runtime.character?.settings?.maxTokens ?? 1000,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    errorCounts.textLarge++;
    logOpenAIError("textLarge", error, errorCounts.textLarge === 1);
    throw error; // Re-throw so ElizaOS can handle it
  }
};

// TEXT_SMALL handler (for quick tasks, structured output)
const textSmallHandler = async (runtime: IAgentRuntime, params: any) => {
  try {
    const client = getOpenAIClient();
    const model = "gpt-4o-mini"; // Use smaller model for efficiency

    const response = await client.chat.completions.create({
      model,
      messages: params.messages || [{ role: "user", content: params.prompt }],
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 500,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    errorCounts.textSmall++;
    logOpenAIError("textSmall", error, errorCounts.textSmall === 1);
    throw error;
  }
};

// TEXT_EMBEDDING handler (for vector embeddings)
const textEmbeddingHandler = async (runtime: IAgentRuntime, params: any) => {
  try {
    const client = getOpenAIClient();
    const model = "text-embedding-3-small";

    const text = params?.text || params?.input || "";
    if (!text) {
      // Return a dummy embedding if no text provided (for dimension setup)
      return new Array(1536).fill(0);
    }

    const response = await client.embeddings.create({
      model,
      input: text,
    });

    return response.data[0]?.embedding || [];
  } catch (error) {
    errorCounts.textEmbedding++;
    logOpenAIError("textEmbedding", error, errorCounts.textEmbedding === 1);
    throw error;
  }
};

// IMAGE_DESCRIPTION handler (for vision/image understanding)
const imageDescriptionHandler = async (runtime: IAgentRuntime, params: any) => {
  try {
    const client = getOpenAIClient();
    const model = "gpt-4o"; // GPT-4o has vision capabilities

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: params.prompt || "Describe this image in detail." },
            { type: "image_url", image_url: { url: params.imageUrl } },
          ],
        },
      ],
      max_tokens: params.maxTokens ?? 500,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    errorCounts.imageDescription++;
    logOpenAIError("imageDescription", error, errorCounts.imageDescription === 1);
    throw error;
  }
};

export const afiOpenAIModelsPlugin: Plugin = {
  name: "afi-openai-models",
  description: "OpenAI model providers for AFI agents (TEXT_LARGE, TEXT_SMALL, TEXT_EMBEDDING, IMAGE_DESCRIPTION)",

  models: {
    TEXT_LARGE: textLargeHandler,
    TEXT_SMALL: textSmallHandler,
    TEXT_EMBEDDING: textEmbeddingHandler,
    IMAGE_DESCRIPTION: imageDescriptionHandler,
  },

  init: async (runtime: IAgentRuntime) => {
    // Log successful initialization with key suffix for debugging
    console.log(`✅ AFI OpenAI Models Plugin: Initialized (key ends with: ${env.openaiKeyDebug})`);
  },
};

export default afiOpenAIModelsPlugin;

