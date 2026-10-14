/**
 * Intelligent Sliding Window Rate Limiter & Abuse Protection
 *
 * Mengatur kuota request per aksi untuk mencegah flood, scraping abusif,
 * dan eksploitasi kuota Turnstile/GitHub API tanpa mengganggu pengalaman pengguna.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetInSeconds: number;
  action: string;
  reason?: string;
}

export interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
  label: string;
}

// Konfigurasi kuota per tipe aksi
export const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  search_query: {
    maxRequests: 40,
    windowMs: 60 * 1000, // 40 query per menit
    label: 'Pencarian Spesimen Dataset'
  },
  dataset_refresh: {
    maxRequests: 6,
    windowMs: 60 * 1000, // 6 refresh jaringan per menit
    label: 'Sinkronisasi Dataset'
  },
  turnstile_action: {
    maxRequests: 6,
    windowMs: 60 * 1000, // 6 aksi gateway per menit
    label: 'Verifikasi Cloudflare Turnstile'
  },
  export_download: {
    maxRequests: 15,
    windowMs: 60 * 1000, // 15 export per menit
    label: 'Ekspor / Unduh Data'
  }
};

type RateLimitListener = (result: RateLimitResult) => void;
const listeners = new Set<RateLimitListener>();

export function subscribeRateLimit(listener: RateLimitListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyRateLimitBlocked(result: RateLimitResult) {
  listeners.forEach((listener) => {
    try {
      listener(result);
    } catch (e) {
      console.error('Error in rate limit listener:', e);
    }
  });
}

function getTimestamps(key: string): number[] {
  try {
    const raw = sessionStorage.getItem(`rl_${key}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTimestamps(key: string, timestamps: number[]) {
  try {
    sessionStorage.setItem(`rl_${key}`, JSON.stringify(timestamps));
  } catch {}
}

/**
 * Memeriksa apakah suatu aksi diperbolehkan oleh sliding-window rate limiter.
 * Jika `recordAttempt = true`, upaya ini akan dicatat ke dalam kuota.
 */
export function checkRateLimit(actionKey: string, recordAttempt: boolean = true): RateLimitResult {
  const rule = RATE_LIMIT_RULES[actionKey] || {
    maxRequests: 30,
    windowMs: 60 * 1000,
    label: actionKey
  };

  const now = Date.now();
  const windowStart = now - rule.windowMs;

  // Filter timestamp yang masih dalam rentang window waktu
  const existingTimestamps = getTimestamps(actionKey).filter((ts) => ts > windowStart);

  if (existingTimestamps.length >= rule.maxRequests) {
    const oldestInWindow = existingTimestamps[0];
    const resetMs = oldestInWindow + rule.windowMs - now;
    const resetInSeconds = Math.max(1, Math.ceil(resetMs / 1000));

    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      limit: rule.maxRequests,
      resetInSeconds,
      action: rule.label,
      reason: `Batas kuota ${rule.label} terlampaui (${rule.maxRequests} req/mnt). Mohon tunggu ${resetInSeconds} detik.`
    };

    notifyRateLimitBlocked(result);
    return result;
  }

  if (recordAttempt) {
    existingTimestamps.push(now);
    saveTimestamps(actionKey, existingTimestamps);
  }

  const remaining = Math.max(0, rule.maxRequests - existingTimestamps.length);
  return {
    allowed: true,
    remaining,
    limit: rule.maxRequests,
    resetInSeconds: 0,
    action: rule.label
  };
}

/**
 * Utilitas Debounce generic untuk menahan input beruntun (misal pengetikan cepat di search bar)
 */
export function debounce<T extends (...args: any[]) => void>(func: T, waitMs: number): (...args: Parameters<T>) => void {
  let timeoutId: any = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };
}
