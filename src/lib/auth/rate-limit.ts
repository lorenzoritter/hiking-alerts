import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_TRACKED_IDENTIFIERS = 10_000;

type Attempt = { count: number; windowStartedAt: number };

// This is intentionally small and dependency-free for the MVP. A distributed
// store such as Redis is required before running multiple web instances.
const attempts = new Map<string, Attempt>();

function removeExpiredAttempts(now: number) {
  for (const [identifier, attempt] of attempts) {
    if (now - attempt.windowStartedAt >= WINDOW_MS) {
      attempts.delete(identifier);
    }
  }
}

export function consumeLoginAttempt(identifier: string) {
  const now = Date.now();
  removeExpiredAttempts(now);
  const attempt = attempts.get(identifier);

  if (!attempt || now - attempt.windowStartedAt >= WINDOW_MS) {
    attempts.set(identifier, { count: 0, windowStartedAt: now });
  }

  const current = attempts.get(identifier);
  if (!current || current.count >= MAX_ATTEMPTS) {
    return false;
  }

  current.count += 1;

  if (attempts.size > MAX_TRACKED_IDENTIFIERS) {
    const oldestIdentifier = attempts.keys().next().value;
    if (oldestIdentifier) {
      attempts.delete(oldestIdentifier);
    }
  }

  return true;
}

export function clearLoginAttempts(identifier: string) {
  attempts.delete(identifier);
}
