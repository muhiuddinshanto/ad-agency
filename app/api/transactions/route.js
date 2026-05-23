import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Client from '@/models/Client';
import { recalculateBalance } from '@/lib/balance';
import { requireRole } from '@/lib/permissions';
import { transactionSchema, formatZodError } from '@/lib/validators';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireRole(['owner', 'admin', 'accountant']);
    if (auth.response) return auth.response;

    await dbConnect();
    const transactions = await Transaction.find({}).populate('client').sort({ createdAt: -1 });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireRole(['owner', 'admin', 'accountant']);
    if (auth.response) return auth.response;

    await dbConnect();
    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    
    const client = await Client.findById(parsed.data.client);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const bdtAmount = parsed.data.bdtAmount;
    const platform = parsed.data.platform || 'General';
    
    // Determine the rate to use
    let rateAtTime = client.ratePerDollar || 120;
    
    if (client.rates) {
      if (platform === 'Facebook' && client.rates.Facebook) rateAtTime = client.rates.Facebook;
      else if (platform === 'Google' && client.rates.Google) rateAtTime = client.rates.Google;
      else if (platform === 'TikTok' && client.rates.TikTok) rateAtTime = client.rates.TikTok;
      else if (platform === 'General' && client.rates.Facebook) rateAtTime = client.rates.Facebook;
    }

    const usdAmount = bdtAmount / rateAtTime;

    const transaction = await Transaction.create({
      client: parsed.data.client,
      platform,
      bdtAmount,
      usdAmount,
      rateAtTime,
      note: parsed.data.note,
      date: parsed.data.date || new Date()
    });
    
    // Auto update client balance
    await recalculateBalance(transaction.client);
    await logAudit({
      action: 'TRANSACTION_CREATE',
      session: auth.session,
      targetId: transaction._id,
      newValues: transaction,
    });
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
