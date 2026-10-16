/**
 * Sliding Window In-Memory Rate Limiter
 * Tracks timestamped hits per API key within a 60-second rolling window.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory cache for sliding window timestamps
const rateLimitCache = new Map<string, RateLimitRecord>();

// Cleanup stale keys every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - 60000;
    rateLimitCache.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((t) => t > cutoff);
      if (record.timestamps.length === 0) {
        rateLimitCache.delete(key);
      }
    });
  }, 300000);
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(keyId: string, limitRpm: number = 60): RateLimitCheckResult {
  const now = Date.now();
  const windowStart = now - 60000;

  let record = rateLimitCache.get(keyId);
  if (!record) {
    record = { timestamps: [] };
    rateLimitCache.set(keyId, record);
  }

  // Retain only timestamps inside the current 60-second window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= limitRpm) {
    // Oldest timestamp in window determines retry-after
    const oldest = record.timestamps[0] || now;
    const retryAfterMs = Math.max(0, oldest + 60000 - now);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      limit: limitRpm,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Record this hit
  record.timestamps.push(now);
  const remaining = Math.max(0, limitRpm - record.timestamps.length);

  return {
    allowed: true,
    limit: limitRpm,
    remaining,
    retryAfterSeconds: 0,
  };
}
