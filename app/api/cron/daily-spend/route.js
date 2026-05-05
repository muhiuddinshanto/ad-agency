import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import DailySpend from '@/models/DailySpend';
import { recalculateBalance } from '@/lib/balance';

export async function GET(req) {
  try {
    await dbConnect();
    
    // Get current date string YYYY-MM-DD
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const startOfToday = new Date(dateStr);

    const activeCampaigns = await Campaign.find({ status: 'running' });
    const results = [];

    for (const campaign of activeCampaigns) {
      // Check if record exists for this campaign and today
      const existing = await DailySpend.findOne({
        campaign: campaign._id,
        date: startOfToday
      });

      if (existing) {
        results.push({ campaign: campaign.name, status: 'skipped (already exists)' });
        continue;
      }

      // Check if campaign has started and not ended
      const start = new Date(campaign.startDate);
      const end = new Date(campaign.endDate);
      
      if (today < start || today > end) {
        results.push({ campaign: campaign.name, status: 'skipped (not in date range)' });
        continue;
      }

      // Calculate daily amount
      let dailyAmount = 0;
      if (campaign.type === 'daily') {
        dailyAmount = campaign.dailyBudget;
      } else {
        // Lifetime
        const durationInMs = Math.max(0, end.getTime() - start.getTime());
        const totalDurationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
        dailyAmount = totalDurationInDays > 0 ? campaign.totalBudget / totalDurationInDays : 0;
      }

      // Create record
      await DailySpend.create({
        client: campaign.client,
        campaign: campaign._id,
        date: startOfToday,
        amount: dailyAmount
      });

      // Recalculate client balance
      await recalculateBalance(campaign.client);

      results.push({ campaign: campaign.name, status: 'created', amount: dailyAmount });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
