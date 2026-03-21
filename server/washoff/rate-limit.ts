export class WashoffRateLimitError extends Error {
  statusCode: number;
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "WashoffRateLimitError";
    this.statusCode = 429;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface WashoffRateLimitPolicy {
  name: string;
  limit: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface WashoffRateLimiter {
  enforce(policy: WashoffRateLimitPolicy, key: string): void;
}

export const createInMemoryWashoffRateLimiter = (): WashoffRateLimiter => {
  const entries = new Map<string, RateLimitEntry>();

  return {
    enforce(policy, key) {
      const entryKey = `${policy.name}:${key}`;
      const currentTime = Date.now();
      const currentEntry = entries.get(entryKey);

      if (!currentEntry || currentEntry.resetAt <= currentTime) {
        entries.set(entryKey, {
          count: 1,
          resetAt: currentTime + policy.windowMs,
        });
        return;
      }

      if (currentEntry.count >= policy.limit) {
        throw new WashoffRateLimitError(
          "تم تجاوز عدد المحاولات المسموح بها مؤقتًا. يرجى إعادة المحاولة لاحقًا.",
          Math.max(Math.ceil((currentEntry.resetAt - currentTime) / 1000), 1),
        );
      }

      currentEntry.count += 1;
      entries.set(entryKey, currentEntry);
    },
  };
};
