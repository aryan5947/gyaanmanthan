// Tiny TTL cache on top of localStorage
export function getCachedJSON<T = any>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > ttlMs) return null;
    return value as T;
  } catch {
    return null;
  }
}

export function setCachedJSON<T = any>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), value }));
  } catch {}
}