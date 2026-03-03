import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Sanitisation ──────────────────────────────────────────────────────────────

/** Strip HTML/script tags and trim whitespace */
export function sanitiseText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/[<>'"`;]/g, '')         // strip dangerous chars
    .trim()
    .slice(0, 500);                   // hard max length
}

/** Sanitise and enforce max length for short fields (names, labels) */
export function sanitiseShort(input: string, max = 100): string {
  return sanitiseText(input).slice(0, max);
}

/** Validate a currency amount string — positive number, max 2 decimals */
export function validateAmount(value: string): { valid: boolean; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: 'Amount is required.' };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return { valid: false, error: 'Enter a valid amount (e.g. 9.99).' };
  const num = parseFloat(trimmed);
  if (num <= 0)         return { valid: false, error: 'Amount must be greater than 0.' };
  if (num > 99_999_999) return { valid: false, error: 'Amount is too large.' };
  return { valid: true, error: '' };
}

/** Validate DD/MM/YYYY date string */
export function validateDate(value: string): { valid: boolean; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true, error: '' }; // optional fields
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return { valid: false, error: 'Use DD/MM/YYYY format.' };
  const [d, m, y] = trimmed.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return { valid: false, error: 'Invalid date.' };
  }
  if (y < 2000 || y > 2100) return { valid: false, error: 'Year must be between 2000 and 2100.' };
  return { valid: true, error: '' };
}

/** Validate email format */
export function validateEmail(email: string): { valid: boolean; error: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { valid: false, error: 'Email is required.' };
  if (trimmed.length > 254) return { valid: false, error: 'Email is too long.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { valid: false, error: 'Enter a valid email address.' };
  return { valid: true, error: '' };
}

/** Validate password strength */
export function validatePassword(password: string): { valid: boolean; error: string } {
  if (!password) return { valid: false, error: 'Password is required.' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters.' };
  if (password.length > 128) return { valid: false, error: 'Password is too long.' };
  return { valid: true, error: '' };
}

/** Validate a day-of-month number (1–31) */
export function validateDayOfMonth(value: string): { valid: boolean; error: string } {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1 || n > 31) return { valid: false, error: 'Enter a day between 1 and 31.' };
  return { valid: true, error: '' };
}

/** Validate year (e.g. vehicle year) */
export function validateYear(value: string): { valid: boolean; error: string } {
  const n = parseInt(value, 10);
  const current = new Date().getFullYear();
  if (isNaN(n) || n < 1900 || n > current + 1) return { valid: false, error: `Enter a year between 1900 and ${current + 1}.` };
  return { valid: true, error: '' };
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

type RateLimitRecord = { count: number; windowStart: number; lockedUntil?: number };

/**
 * Check and increment a named rate limit.
 * @param key      Unique identifier (e.g. 'login', 'promo')
 * @param max      Max attempts allowed in the window
 * @param windowMs Window duration in ms (default 15 min)
 * @param lockMs   Lock duration after exceeding max (default 15 min)
 * @returns { allowed, retryAfterSeconds }
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs = 15 * 60 * 1000,
  lockMs   = 15 * 60 * 1000,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const storageKey = `rl_${key}`;
  const now = Date.now();

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const record: RateLimitRecord = raw ? JSON.parse(raw) : { count: 0, windowStart: now };

    // Still locked?
    if (record.lockedUntil && now < record.lockedUntil) {
      return { allowed: false, retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000) };
    }

    // Reset window if expired
    if (now - record.windowStart > windowMs) {
      const fresh: RateLimitRecord = { count: 1, windowStart: now };
      await AsyncStorage.setItem(storageKey, JSON.stringify(fresh));
      return { allowed: true, retryAfterSeconds: 0 };
    }

    // Increment
    record.count += 1;

    if (record.count > max) {
      record.lockedUntil = now + lockMs;
      await AsyncStorage.setItem(storageKey, JSON.stringify(record));
      return { allowed: false, retryAfterSeconds: Math.ceil(lockMs / 1000) };
    }

    await AsyncStorage.setItem(storageKey, JSON.stringify(record));
    return { allowed: true, retryAfterSeconds: 0 };
  } catch {
    // Fail open — don't block the user on storage errors
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Reset a rate limit key (e.g. on successful login) */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`rl_${key}`);
  } catch {}
}

/** Format a retry-after duration into a human-readable string */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  return `${Math.ceil(seconds / 3600)}h`;
}

// ── Promo code ────────────────────────────────────────────────────────────────

/**
 * Timing-safe string comparison — prevents timing attacks on promo codes.
 * Returns true only if both strings are identical.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to prevent length-based timing leak
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Sanitise a promo code input — uppercase, alphanumeric + hyphens only */
export function sanitisePromoCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9\-]/g, '')
    .slice(0, 32);
}

// ── Content security ──────────────────────────────────────────────────────────

/** Max character limits for each field type */
export const MAX_LENGTHS = {
  name:        100,
  description: 300,
  note:        500,
  address:     200,
  bankName:    100,
  label:       100,
  amount:      15,   // "99999999.99"
  promoCode:   32,
} as const;