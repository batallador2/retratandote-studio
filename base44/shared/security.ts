// Utilidades de seguridad compartidas entre las funciones de acceso por token.

// Rate limiting en memoria por IP: mitiga fuerza bruta sobre tokens.
const rateBuckets = new Map();
const RATE_WINDOW_MS = 60_000; // 1 minuto

export function checkRateLimit(req, limit) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    bucket.count += 1;
    if (bucket.count > limit) return false;
  }
  if (rateBuckets.size > 10_000) {
    for (const [key, b] of rateBuckets) {
      if (now > b.resetAt) rateBuckets.delete(key);
    }
  }
  return true;
}

// Solo se aceptan tokens UUID v4 de alta entropía (crypto.randomUUID).
export const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;