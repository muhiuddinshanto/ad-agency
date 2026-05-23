import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from './auth';

export async function getCurrentSession() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireRole(allowedRoles) {
  const session = await getCurrentSession();
  if (!session) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!allowedRoles.includes(session.role)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}
