import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Client from '@/models/Client';
import { recalculateBalance } from '@/lib/balance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const transactions = await Transaction.find({}).populate('client').sort({ createdAt: -1 });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const client = await Client.findById(body.client);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const bdtAmount = parseFloat(body.bdtAmount);
    const platform = body.platform || 'General';
    
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
      client: body.client,
      platform,
      bdtAmount,
      usdAmount,
      rateAtTime,
      note: body.note,
      date: body.date || new Date()
    });
    
    // Auto update client balance
    await recalculateBalance(transaction.client);
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
