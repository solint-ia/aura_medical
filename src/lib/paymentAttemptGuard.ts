import { createHash } from "crypto";

interface AttemptBucket {
  attempts: number[];
  blockedUntil?: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 5;
const MIN_INTERVAL_MS = 10 * 1000;
const HIGH_RISK_COOLDOWN_MS = 30 * 60 * 1000;

const globalWithPaymentAttempts = globalThis as typeof globalThis & {
  __auraPaymentAttempts?: Map<string, AttemptBucket>;
};

const buckets =
  globalWithPaymentAttempts.__auraPaymentAttempts ?? new Map<string, AttemptBucket>();
globalWithPaymentAttempts.__auraPaymentAttempts = buckets;

export function cardFingerprint(nonSensitiveReference: string): string {
  return createHash("sha256")
    .update(nonSensitiveReference.replace(/\D/g, ""))
    .digest("hex")
    .slice(0, 24);
}

export function paymentAttemptKey(userId: string, ip: string, cardReference?: string): string {
  return `${userId}:${ip || "unknown"}:${cardReference || "pix"}`;
}

export function checkAndRecordPaymentAttempt(key: string):
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; error: string } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { attempts: [] };
  bucket.attempts = bucket.attempts.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
      error: "Este cartão está temporariamente bloqueado após uma recusa de segurança. Aguarde ou utilize outro meio de pagamento.",
    };
  }

  const lastAttempt = bucket.attempts.at(-1);
  if (lastAttempt && now - lastAttempt < MIN_INTERVAL_MS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((MIN_INTERVAL_MS - (now - lastAttempt)) / 1000),
      error: "Aguarde alguns segundos antes de realizar uma nova tentativa.",
    };
  }

  if (bucket.attempts.length >= MAX_ATTEMPTS_PER_WINDOW) {
    const retryAt = bucket.attempts[0] + WINDOW_MS;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
      error: "Limite temporário de tentativas de pagamento atingido. Aguarde antes de tentar novamente.",
    };
  }

  bucket.attempts.push(now);
  buckets.set(key, bucket);
  return { allowed: true };
}

export function markHighRiskAttempt(key: string): void {
  const bucket = buckets.get(key) ?? { attempts: [] };
  bucket.blockedUntil = Date.now() + HIGH_RISK_COOLDOWN_MS;
  buckets.set(key, bucket);
}
