import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Load from '@/models/Load';
import { recalculateBalance } from '@/lib/balance';
import { requireRole } from '@/lib/permissions';
import { loadSchema, formatZodError } from '@/lib/validators';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

    await dbConnect();
    const loads = await Load.find({}).populate('client').sort({ createdAt: -1 });
    return NextResponse.json(loads);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

    await dbConnect();
    const body = await req.json();
    const parsed = loadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    
    const load = await Load.create({
      client: parsed.data.client,
      usdAmount: parsed.data.usdAmount,
      date: parsed.data.date || new Date(),
      note: parsed.data.note
    });
    
    await recalculateBalance(load.client);
    await logAudit({
      action: 'LOAD_CREATE',
      session: auth.session,
      targetId: load._id,
      newValues: load,
    });
    
    return NextResponse.json(load, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
