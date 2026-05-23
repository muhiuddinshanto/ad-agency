export const AUTH_COOKIE_NAME = 'epic_agency_session';
export const ROLES = ['owner', 'admin', 'accountant'];

export function getAuthConfig() {
  return {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    sessionSecret: process.env.AUTH_SECRET || 'dev-session-token-change-me',
  };
}

export function isProductionAuthConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET);
}

function base64UrlEncode(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function hmacSha256(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function signSession(session) {
  const payload = {
    ...session,
    role: ROLES.includes(session.role) ? session.role : 'accountant',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacSha256(encodedPayload, getAuthConfig().sessionSecret);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes('.')) return null;

  const [encodedPayload, signature] = token.split('.');
  const expectedSignature = await hmacSha256(encodedPayload, getAuthConfig().sessionSecret);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)));
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.email || !ROLES.includes(payload.role)) return null;
    return payload;
  } catch {
    return null;
  }
}
