import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getBucketKey(scope: string, identity: string) {
  return `${scope}:${identity}`;
}

export function createRateLimitResponse(message: string, retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: {
        code: "RATE_LIMITED",
        message,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

export function enforceRateLimit({
  scope,
  identity,
  limit,
  windowMs,
  message,
}: {
  scope: string;
  identity: string;
  limit: number;
  windowMs: number;
  message: string;
}) {
  const key = getBucketKey(scope, identity);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return createRateLimitResponse(message, retryAfterSeconds);
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return null;
}

export function getRequestIdentity(request: Request, fallback: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || fallback;
}
