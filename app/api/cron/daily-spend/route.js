import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { recalculateBalance } from '@/lib/balance';
import { backfillAllActiveCampaigns } from '@/lib/dailySpend';
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
    
    // Get custom date or default to today YYYY-MM-DD
    const customDateParam = url.searchParams.get('date');
    let targetDate = new Date();
    
    if (customDateParam) {
      const parsedDate = new Date(customDateParam);
      if (!isNaN(parsedDate.getTime())) {
        targetDate = parsedDate;
      }
    }
    
    const { results, clientsToUpdate } = await backfillAllActiveCampaigns(targetDate);

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
