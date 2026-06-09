interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitRecord>();

export function createRequestId() {
  return crypto.randomUUID();
}

export function getClientKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.slice(0, 80) ?? "unknown";
  return `${scope}:${forwardedFor || realIp || "local"}:${userAgent}`;
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: current.resetAt
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt
  };
}

export function rateLimitHeaders(result: ReturnType<typeof rateLimit>, requestId: string) {
  return {
    "X-Request-Id": requestId,
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString()
  };
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

function trustedOriginHosts() {
  const hosts = new Set(["halindosa.com", "www.halindosa.com", "localhost", "127.0.0.1"]);

  for (const value of [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_URL]) {
    if (!value?.trim()) continue;
    try {
      const url = value.startsWith("http") ? new URL(value) : new URL(`https://${value}`);
      hosts.add(normalizeHost(url.host));
    } catch {
      hosts.add(normalizeHost(value));
    }
  }

  return hosts;
}

export function isTrustedRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const host = normalizeHost(new URL(origin).host);
    return trustedOriginHosts().has(host);
  } catch {
    return false;
  }
}

export function jsonHeaders(requestId: string) {
  return {
    "X-Request-Id": requestId
  };
}
