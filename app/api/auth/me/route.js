import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    email: session.email,
    name: session.name,
    role: session.role,
  });
}
