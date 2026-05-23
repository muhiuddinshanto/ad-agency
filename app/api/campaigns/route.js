import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import { recalculateBalance } from '@/lib/balance';
import { requireRole } from '@/lib/permissions';
import { campaignSchema, formatZodError } from '@/lib/validators';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

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
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

    await dbConnect();
    const body = await req.json();
    const parsed = campaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const campaign = await Campaign.create(parsed.data);
    
    // Auto update client balance
    await recalculateBalance(campaign.client);
    await logAudit({
      action: 'CAMPAIGN_CREATE',
      session: auth.session,
      targetId: campaign._id,
      newValues: campaign,
    });
    
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
