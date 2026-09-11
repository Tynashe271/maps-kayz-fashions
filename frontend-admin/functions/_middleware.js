// Cloudflare Pages Function — runs on every request to this project before
// any static asset is served. Gates the whole admin app behind HTTP Basic
// Auth as a lightweight extra layer in front of the app's own JWT staff
// login (see DEPLOYMENT.md — Cloudflare Access needs a card on file even on
// its free plan, so this is the no-card alternative).
//
// BASIC_AUTH_USER / BASIC_AUTH_PASS are set as Pages environment variables
// (Settings > Environment variables) — server-side only, never bundled into
// the client-side app.
export async function onRequest({ request, env, next }) {
  const { BASIC_AUTH_USER, BASIC_AUTH_PASS } = env;

  // If the credentials aren't configured (e.g. a preview deploy without
  // them set), fail open rather than lock everyone out silently.
  if (!BASIC_AUTH_USER || !BASIC_AUTH_PASS) {
    return next();
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  const [scheme, encoded] = authHeader.split(' ');

  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try {
      decoded = atob(encoded);
    } catch {
      // Malformed base64 — fall through to the 401 below.
    }
    const sepIndex = decoded.indexOf(':');
    const user = sepIndex === -1 ? decoded : decoded.slice(0, sepIndex);
    const pass = sepIndex === -1 ? '' : decoded.slice(sepIndex + 1);

    if (timingSafeEqual(user, BASIC_AUTH_USER) && timingSafeEqual(pass, BASIC_AUTH_PASS)) {
      return next();
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Maps Kayz Admin", charset="UTF-8"' },
  });
}

// Plain === on secrets leaks timing information; this compares in constant
// time relative to the expected value's length.
function timingSafeEqual(a, b) {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}
