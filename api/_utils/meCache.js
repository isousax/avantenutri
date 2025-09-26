import crypto from 'crypto';

const tokenCache = new Map(); // hash(token) -> { data, expiry, created }

const DEFAULT_TTL_MS = Number(process.env.ME_CACHE_TTL_MS || 60000);
const MIN_TTL_MS = 5000;
const MAX_TTL_MS = 5 * 60 * 1000;

function clampTtl(ms) {
  if (isNaN(ms) || ms <= 0) return DEFAULT_TTL_MS;
  return Math.min(Math.max(ms, MIN_TTL_MS), MAX_TTL_MS);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function meCacheGet(token) {
  try {
    const key = hashToken(token);
    const entry = tokenCache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (entry.expiry < now) {
      tokenCache.delete(key);
      return null;
    }
    if (entry.data?.exp && typeof entry.data.exp === 'number' && now >= entry.data.exp * 1000) {
      tokenCache.delete(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function meCacheSet(token, data, ttlMs) {
  try {
    const key = hashToken(token);
    const now = Date.now();
    tokenCache.set(key, {
      data: { ...data, _cached: true },
      expiry: now + clampTtl(ttlMs),
      created: now,
    });
  } catch {}
}

export function meCacheInvalidateToken(token) {
  try {
    const key = hashToken(token);
    tokenCache.delete(key);
  } catch {}
}

export function meCacheClearAll() {
  tokenCache.clear();
}

export function meCacheStats() {
  return { size: tokenCache.size };
}