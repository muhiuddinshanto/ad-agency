import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import { recalculateBalance } from '@/lib/balance';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const campaign = await Campaign.findById(params.id).populate('client');
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // We use findById and save() to ensure pre-save hooks trigger
    const campaign = await Campaign.findById(params.id);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    
    Object.assign(campaign, body);
    await campaign.save();
    
    // Auto update client balance
    await recalculateBalance(campaign.client);
    
    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const campaign = await Campaign.findById(params.id);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    
    const clientId = campaign.client;
    await Campaign.findByIdAndDelete(params.id);
    
    // Auto update client balance
    await recalculateBalance(clientId);
    
    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
