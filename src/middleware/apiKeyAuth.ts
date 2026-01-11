import type { NextFunction, Request, Response } from "express";
import type { ApiKeyStore, RateLimitRule, ApiKeyRecord } from "../services/apiKeyStore.js";

export interface TenantContext {
  tenantId: string;
  keyId: string;
}

export type AuthedRequest = Request & { tenant?: TenantContext };

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimiter {
  check(keyId: string, rule?: RateLimitRule): { allowed: boolean; retryAfter?: number };
}

export function createRateLimiter(defaultRule: RateLimitRule): RateLimiter {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    check(keyId: string, rule?: RateLimitRule) {
      const applied = rule ?? defaultRule;
      const now = Date.now();
      const bucket = buckets.get(keyId);

      if (!bucket || now >= bucket.resetAt) {
        const resetAt = now + applied.windowSeconds * 1000;
        buckets.set(keyId, { count: 1, resetAt });
        return { allowed: true };
      }

      if (bucket.count < applied.limit) {
        bucket.count += 1;
        buckets.set(keyId, bucket);
        return { allowed: true };
      }

      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    },
  };
}

function extractApiKey(req: Request): string | null {
  const header = req.header("x-api-key") || req.header("authorization");
  if (!header) return null;
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7);
  return header;
}

export function apiKeyAuthMiddleware(params: {
  apiKeyStore: ApiKeyStore;
  rateLimiter: RateLimiter;
}) {
  const { apiKeyStore, rateLimiter } = params;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = extractApiKey(req);
      if (!apiKey) {
        return res.status(401).json({ error: "missing_api_key" });
      }

      const record: ApiKeyRecord | null = await apiKeyStore.findByApiKey(apiKey);
      if (!record) {
        return res.status(401).json({ error: "invalid_api_key" });
      }

      const rateCheck = rateLimiter.check(record.keyId, record.rateLimit);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: "rate_limited",
          retryAfterSeconds: rateCheck.retryAfter ?? 0,
        });
      }

      (req as AuthedRequest).tenant = {
        tenantId: record.tenantId,
        keyId: record.keyId,
      };

      await apiKeyStore.markUsed(record.keyId);
      next();
    } catch (err) {
      console.error("[apiKeyAuth] failed", err);
      return res.status(500).json({ error: "auth_internal_error" });
    }
  };
}
