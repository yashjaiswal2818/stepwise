import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-IP rate limiting for the tutor route.
 *
 * Two independent sliding windows — a burst cap and a daily cap — so one user
 * (or a runaway loop) can't drain the free tier. Distributed via Upstash Redis
 * when configured; otherwise an in-memory per-instance fallback so local dev is
 * still testable and never fully unprotected.
 *
 * Limits are starting guesses (per the PRD) and are env-overridable so you can
 * tune from real logs — and force a low cap when testing the 429 path. A cap of
 * 0 is a deliberate kill switch (blocks everything); negatives and non-numbers
 * are rejected in favour of the default rather than silently changing behaviour.
 */

function posIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    console.warn(`[ratelimit] ${name}="${raw}" is not a non-negative integer — using default ${fallback}.`);
    return fallback;
  }
  return n; // 0 is allowed on purpose: it means "block all".
}

const BURST_TOKENS = posIntEnv("RL_BURST_PER_MIN", 10);
const DAILY_TOKENS = posIntEnv("RL_DAILY_PER_DAY", 100);

const BURST_WINDOW_MS = 60_000;
const DAILY_WINDOW_MS = 86_400_000;

export type RateTier = "burst" | "daily";
export type RateBackend = "upstash" | "memory" | "open";

export interface RateLimitResult {
  ok: boolean;
  /** Which limit tripped, for the user-facing message and logs. Null when allowed. */
  tier: RateTier | null;
  /** Seconds until the tripped window resets — the Retry-After value. */
  retryAfterSec: number;
  /** How this was decided, for logging: distributed, per-instance, or failed-open. */
  backend: RateBackend;
  /** Requests left in the tighter of the two windows (best effort). */
  remaining: number;
}

/** The uniform shape both backends return, so one control flow drives both. */
interface WindowResult {
  success: boolean;
  reset: number; // ms epoch when this window resets
  remaining: number;
  /** True when Upstash failed OPEN on a timeout rather than actually deciding. */
  degraded?: boolean;
}

// Upstash is "configured" only when BOTH REST vars are present. fromEnv() does
// not throw on missing vars (it only warns), so we must check this ourselves.
const upstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);
const backendLabel: RateBackend = upstashConfigured ? "upstash" : "memory";

// Module-scope so instances (and their caches) survive across warm serverless
// invocations. `timeout: 2000` bounds how long a HUNG Redis waits before failing
// open; a REJECTED call still throws and is caught in rateLimit().
let burstRl: Ratelimit | null = null;
let dailyRl: Ratelimit | null = null;

if (upstashConfigured) {
  const redis = Redis.fromEnv();
  burstRl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(BURST_TOKENS, "1 m"),
    prefix: "stepwise:burst",
    timeout: 2000,
    analytics: false,
  });
  dailyRl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(DAILY_TOKENS, "1 d"),
    prefix: "stepwise:daily",
    timeout: 2000,
    analytics: false,
  });
} else {
  console.warn(
    "[ratelimit] Upstash not configured (UPSTASH_REDIS_REST_URL/TOKEN unset) — " +
      "using in-memory per-instance limiting. Set Upstash creds before any public deploy.",
  );
}

/**
 * A per-instance sliding-window log. Correct for a single process; on serverless
 * it only sees one instance's traffic, which is why Upstash is the real backend.
 *
 * Bounded to MAX_KEYS entries: on overflow it drops fully-expired keys, then
 * evicts oldest-inserted keys until under budget. So it cannot grow unbounded
 * even under a flood of distinct IPs, and the eviction scan runs only when over
 * the cap (not on every request).
 */
class MemoryWindow {
  private hits = new Map<string, number[]>();
  private static readonly MAX_KEYS = 10_000;

  constructor(
    private readonly tokens: number,
    private readonly windowMs: number,
  ) {}

  check(key: string): WindowResult {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.tokens) {
      if (recent.length > 0) this.hits.set(key, recent);
      else this.hits.delete(key); // tokens=0 kill switch: don't accumulate empty arrays
      return { success: false, reset: (recent[0] ?? now) + this.windowMs, remaining: 0 };
    }
    recent.push(now);
    this.hits.set(key, recent);
    this.evictIfNeeded(now);
    return { success: true, reset: now + this.windowMs, remaining: this.tokens - recent.length };
  }

  private evictIfNeeded(now: number): void {
    if (this.hits.size <= MemoryWindow.MAX_KEYS) return;
    // Drop keys whose newest hit has fully expired (newest expired ⇒ all expired).
    for (const [k, v] of this.hits) {
      if (v.length === 0 || v[v.length - 1] + this.windowMs <= now) this.hits.delete(k);
    }
    // Still over budget (many live keys) → evict oldest-inserted. An evicted key
    // just gets a fresh window next time — acceptable under memory pressure.
    while (this.hits.size > MemoryWindow.MAX_KEYS) {
      const oldest = this.hits.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.hits.delete(oldest);
    }
  }
}

const memBurst = new MemoryWindow(BURST_TOKENS, BURST_WINDOW_MS);
const memDaily = new MemoryWindow(DAILY_TOKENS, DAILY_WINDOW_MS);

const resetSec = (resetMs: number): number => Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));

/** Check one window against the active backend (Upstash if configured, else memory). */
async function checkWindow(rl: Ratelimit | null, mem: MemoryWindow, ip: string): Promise<WindowResult> {
  if (rl) {
    const r = await rl.limit(ip);
    // reason === "timeout" means the lib failed open on a hung Redis — surface it
    // so a degraded backend is visible in logs instead of looking like a healthy allow.
    return { success: r.success, reset: r.reset, remaining: r.remaining, degraded: r.reason === "timeout" };
  }
  return mem.check(ip);
}

// Throttle the fail-open log so a Redis outage produces bounded, structured
// telemetry rather than one line per request.
let lastFailOpenLogAt = 0;
function logFailOpen(err: unknown): void {
  const now = Date.now();
  if (now - lastFailOpenLogAt < 10_000) return;
  lastFailOpenLogAt = now;
  try {
    console.log(JSON.stringify({ ev: "rl_fail_open", msg: err instanceof Error ? err.message : String(err) }));
  } catch {
    /* never let logging throw into the request path */
  }
}

/**
 * Check both windows for one IP. Burst first; daily is only consumed when burst
 * passes, so a burst-rejected request doesn't also burn a daily token. One shared
 * control flow drives both backends. A thrown Upstash error (Redis down, not a
 * timeout) fails OPEN — a transient infra blip must not take Ada down; the Vercel
 * spend cap is the real backstop.
 */
export async function rateLimit(ip: string): Promise<RateLimitResult> {
  try {
    const b = await checkWindow(burstRl, memBurst, ip);
    if (!b.success) {
      return { ok: false, tier: "burst", retryAfterSec: resetSec(b.reset), backend: backendLabel, remaining: 0 };
    }
    const d = await checkWindow(dailyRl, memDaily, ip);
    if (!d.success) {
      return { ok: false, tier: "daily", retryAfterSec: resetSec(d.reset), backend: backendLabel, remaining: 0 };
    }
    const degraded = Boolean(b.degraded || d.degraded);
    return {
      ok: true,
      tier: null,
      retryAfterSec: 0,
      backend: degraded ? "open" : backendLabel,
      remaining: Math.min(b.remaining, d.remaining),
    };
  } catch (err) {
    logFailOpen(err);
    return { ok: true, tier: null, retryAfterSec: 0, backend: "open", remaining: 0 };
  }
}
