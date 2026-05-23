import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import DailySpend from '@/models/DailySpend';

import { recalculateBalance } from '@/lib/balance';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireRole(['owner', 'admin']);
    if (auth.response) return auth.response;

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
      const dueUSD = client.contractDue || 0; // Budget - Paid
      const walletBal = client.walletBalance || 0;
      const isOverdrawn = isWallet && walletBal < 0;
      
      // Calculate BDT equivalent
      const rate = client.rates?.Facebook || client.ratePerDollar || 120;
      
      // For wallet clients, the 'Due' is the absolute overdraft amount if overdrawn
      // Otherwise, use budget-based due for campaign clients
      const displayDue = isWallet ? (isOverdrawn ? Math.abs(walletBal) : 0) : Math.max(0, dueUSD);
      
      return {
        ...client.toObject(),
        dueUSD: displayDue,
        dueBDT: displayDue * rate,
        isOverdrawn
      };
    }).filter(c => c.dueUSD > 0);

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
