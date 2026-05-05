import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import DailySpend from '@/models/DailySpend';

import { recalculateBalance } from '@/lib/balance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    // STRICT READ-ONLY: We do not call recalculateBalance or reconcileClientFinance here.
    // Dashboard just reads what is already in the database truth.
    const clients = await Client.find({});
    
    // 1. Total Revenue (Total Paid USD across all clients)
    const totalRevenue = clients.reduce((sum, client) => sum + (client.totalPaid || 0), 0);
    
    // 2. Total Campaign Budget (All clients)
    const totalCampaignBudget = clients.reduce((sum, client) => sum + (client.totalBudget || 0), 0);
    
    // 3. Total Running Spend (All clients)
    const totalRunningSpend = clients.reduce((sum, client) => sum + (client.totalSpent || 0), 0);
    
    // 4. Total Due (Based on ledger: Spend - Paid)
    const unpaidClients = clients.map(client => {
      const isWallet = client.serviceType === 'wallet';
      const dueUSD = client.contractDue || 0; // Cached as Spend - Paid in recalculateBalance
      
      // Calculate BDT equivalent using client's rate (Facebook rate as default)
      const rate = client.rates?.Facebook || client.ratePerDollar || 120;
      const dueBDT = dueUSD * rate;
      
      return {
        ...client.toObject(),
        dueUSD,
        dueBDT,
        displayDue: dueUSD,
        isOverdrawn: isWallet && (client.walletBalance < 0)
      };
    }).filter(c => c.dueUSD > 0 || c.isOverdrawn);

    const totalDue = unpaidClients.reduce((sum, client) => sum + Math.max(0, client.dueUSD), 0);
    
    // Daily Spend Stats
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const todaySpend = await DailySpend.aggregate([
      { $match: { date: new Date(todayStr) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const yesterdaySpend = await DailySpend.aggregate([
      { $match: { date: new Date(yesterdayStr) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const spendHistory = await DailySpend.aggregate([
      { $sort: { date: -1 } },
      { $limit: 14 },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: { $sum: "$amount" }
      }},
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      totalRevenue,
      totalCampaignBudget,
      totalRunningSpend,
      totalDue,
      unpaidClients,
      todaySpend: todaySpend[0]?.total || 0,
      yesterdaySpend: yesterdaySpend[0]?.total || 0,
      spendHistory,
      isSystemSynced: true // Always true in ledger mode unless manual check fails
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
