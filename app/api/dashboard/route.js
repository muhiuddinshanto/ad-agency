import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Campaign from '@/models/Campaign';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    const clients = await Client.find({});
    const campaigns = await Campaign.find({});
    
    const totalPlannedBudget = clients.reduce((sum, client) => sum + (client.totalBudget || 0), 0);
    const totalRunningSpend = clients.reduce((sum, client) => sum + (client.totalSpent || 0), 0);
    const totalPaid = clients.reduce((sum, client) => sum + (client.totalPaid || 0), 0);
    const totalDue = clients.reduce((sum, client) => {
        return client.balance < 0 ? sum + Math.abs(client.balance) : sum;
    }, 0);
    
    const unpaidClients = clients.filter(client => client.balance < 0);

    return NextResponse.json({
      totalPlannedBudget,
      totalRunningSpend,
      totalPaid,
      totalDue,
      unpaidClients
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
