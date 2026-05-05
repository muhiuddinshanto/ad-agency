import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import { recalculateBalance } from '@/lib/balance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    // STRICT READ-ONLY: We do not call recalculateBalance here.
    // Use cached values in Client document for speed.
    const campaigns = await Campaign.find({}).populate('client').sort({ createdAt: -1 });
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const campaign = await Campaign.create(body);
    
    // Auto update client balance
    await recalculateBalance(campaign.client);
    
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
