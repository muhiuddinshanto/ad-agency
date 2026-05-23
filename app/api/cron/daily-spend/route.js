import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import DailySpend from '@/models/DailySpend';
import { recalculateBalance } from '@/lib/balance';
import { requireRole } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // Check for Cron Secret bypass
    const url = new URL(req.url);
    const secretParam = url.searchParams.get('secret');
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    let auth = null;
    if (cronSecret && (secretParam === cronSecret || authHeader === `Bearer ${cronSecret}`)) {
      auth = { session: { email: 'cron@system.local', role: 'owner' } };
    } else {
      auth = await requireRole(['owner', 'admin']);
      if (auth.response) return auth.response;
    }

    await dbConnect();
    
    // Get current date string YYYY-MM-DD
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const startOfToday = new Date(dateStr);

    const activeCampaigns = await Campaign.find({ status: 'running' });
    const results = [];
    const clientsToUpdate = new Set();

    for (const campaign of activeCampaigns) {
      // Check if campaign has started and not ended
      const start = new Date(campaign.startDate);
      const end = new Date(campaign.endDate);
      
      // Use UTC normalized date for comparison
      const todayUTC = new Date(dateStr);
      
      if (todayUTC < start || todayUTC > end) {
        results.push({ campaign: campaign.name, status: 'skipped (not in date range)' });
        continue;
      }

      // Check if record exists for this campaign and today
      const existing = await DailySpend.findOne({
        campaign: campaign._id,
        date: startOfToday
      });

      if (existing) {
        results.push({ campaign: campaign.name, status: 'skipped (already exists)' });
        continue;
      }

      // Calculate daily amount
      let dailyAmount = 0;
      if (campaign.type === 'daily') {
        dailyAmount = campaign.dailyBudget;
      } else {
        // Lifetime
        const durationInMs = Math.max(0, end.getTime() - start.getTime());
        const totalDurationInDays = Math.max(1, Math.ceil(durationInMs / (1000 * 60 * 60 * 24)));
        dailyAmount = campaign.totalBudget / totalDurationInDays;
      }

      // Create record
      await DailySpend.create({
        client: campaign.client,
        campaign: campaign._id,
        date: startOfToday,
        amount: dailyAmount
      });

      clientsToUpdate.add(campaign.client.toString());
      results.push({ campaign: campaign.name, status: 'created', amount: dailyAmount });
    }

    // Recalculate balances only once per client
    for (const clientId of clientsToUpdate) {
      await recalculateBalance(clientId);
    }
    await logAudit({
      action: 'DAILY_SPEND_TRACKER_RUN',
      session: auth.session,
      newValues: { results },
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
