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
    
    const initialClients = await Client.find({});
    for (const client of initialClients) {
      await recalculateBalance(client._id);
    }
    
    const clients = await Client.find({});
    
    const totalPlannedBudget = clients.reduce((sum, client) => sum + (client.totalBudget || 0), 0);
    const totalRunningSpend = clients.reduce((sum, client) => sum + (client.totalSpent || 0), 0);
    const totalPaid = clients.reduce((sum, client) => sum + (client.totalPaid || 0), 0);
    const totalDue = clients.reduce((sum, client) => {
        return client.balance < 0 ? sum + Math.abs(client.balance) : sum;
    }, 0);
    
    const unpaidClients = clients.filter(client => client.balance < 0);
    
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
      { $limit: 14 }, // Last 14 days
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: { $sum: "$amount" }
      }},
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      totalPlannedBudget,
      totalRunningSpend,
      totalPaid,
      totalDue,
      unpaidClients,
      todaySpend: todaySpend[0]?.total || 0,
      yesterdaySpend: yesterdaySpend[0]?.total || 0,
      spendHistory
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
