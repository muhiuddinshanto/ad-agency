import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import Transaction from '@/models/Transaction';
import Load from '@/models/Load';
import DailySpend from '@/models/DailySpend';
import { recalculateBalance } from '@/lib/balance';
import { requireRole } from '@/lib/permissions';
import { clientSchema, formatZodError } from '@/lib/validators';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const auth = await requireRole(['owner', 'admin', 'accountant']);
    if (auth.response) return auth.response;

    await dbConnect();
    const client = await Client.findById(params.id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    
    // STRICT READ-ONLY
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

    await dbConnect();
    const body = await req.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    
    const client = await Client.findById(params.id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    const oldClient = client.toObject();

    // Update basic fields
    client.name = parsed.data.name;
    client.email = parsed.data.email;
    client.phone = parsed.data.phone;
    client.companyName = parsed.data.companyName;
    client.ratePerDollar = parsed.data.ratePerDollar;
    client.serviceType = parsed.data.serviceType;
    
    client.rates = parsed.data.rates;

    await client.save();
    const balanceData = await recalculateBalance(client._id);
    await logAudit({
      action: 'CLIENT_UPDATE',
      session: auth.session,
      targetId: client._id,
      oldValues: oldClient,
      newValues: client,
    });
    
    return NextResponse.json({
      ...client.toObject(),
      ...balanceData
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

    await dbConnect();
    const client = await Client.findByIdAndDelete(params.id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    
    // Keep all source collections in sync when a client is removed.
    await Campaign.deleteMany({ client: params.id });
    await Transaction.deleteMany({ client: params.id });
    await Load.deleteMany({ client: params.id });
    await DailySpend.deleteMany({ client: params.id });
    await logAudit({
      action: 'CLIENT_DELETE',
      session: auth.session,
      targetId: params.id,
      oldValues: client,
    });
    
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
