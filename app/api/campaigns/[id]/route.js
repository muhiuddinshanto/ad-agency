import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import DailySpend from '@/models/DailySpend';
import { recalculateBalance } from '@/lib/balance';
import { requireRole } from '@/lib/permissions';
import { campaignSchema, formatZodError } from '@/lib/validators';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

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
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

    await dbConnect();
    const body = await req.json();
    const parsed = campaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    
    // We use findById and save() to ensure pre-save hooks trigger
    const campaign = await Campaign.findById(params.id);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    const oldCampaign = campaign.toObject();
    
    Object.assign(campaign, parsed.data);
    await campaign.save();
    
    // Auto update client balance
    await recalculateBalance(campaign.client);
    await logAudit({
      action: 'CAMPAIGN_UPDATE',
      session: auth.session,
      targetId: campaign._id,
      oldValues: oldCampaign,
      newValues: campaign,
    });
    
    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

    await dbConnect();
    const campaign = await Campaign.findById(params.id);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    
    const clientId = campaign.client;
    await Campaign.findByIdAndDelete(params.id);
    await DailySpend.deleteMany({ campaign: params.id });
    
    // Auto update client balance
    await recalculateBalance(clientId);
    await logAudit({
      action: 'CAMPAIGN_DELETE',
      session: auth.session,
      targetId: params.id,
      oldValues: campaign,
    });
    
    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
