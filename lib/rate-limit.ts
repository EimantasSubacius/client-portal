type Bucket = number[];

const hits = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const prev = hits.get(key) ?? [];
  const recent = prev.filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { allowed: false, remaining: 0 };
  }
  recent.push(now);
  hits.set(key, recent);
  return { allowed: true, remaining: Math.max(0, limit - recent.length) };
}

/** P0: 5 login attempts / 10 minutes per IP+email */
export function loginRateLimit(ip: string, email: string) {
  return rateLimit(`login:${ip}:${email.toLowerCase()}`, 5, 10 * 60 * 1000);
}

export function messageRateLimit(userId: string) {
  return rateLimit(`msg:${userId}`, 10, 5 * 60 * 1000);
}
