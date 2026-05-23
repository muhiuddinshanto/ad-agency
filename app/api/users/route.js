import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';
import { requireRole } from '@/lib/permissions';
import { userSchema, formatZodError } from '@/lib/validators';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireRole(['owner']);
    if (auth.response) return auth.response;

    await dbConnect();
    const users = await User.find({})
      .select('email name role isActive createdAt updatedAt')
      .sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireRole(['owner']);
    if (auth.response) return auth.response;

    await dbConnect();
    const body = await req.json();
    const parsed = userSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const passwordData = hashPassword(parsed.data.password);
    const user = await User.create({
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
    });

    await logAudit({
      action: 'USER_CREATE',
      session: auth.session,
      targetId: user._id,
      newValues: { email: user.email, name: user.name, role: user.role, isActive: user.isActive },
    });

    return NextResponse.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
