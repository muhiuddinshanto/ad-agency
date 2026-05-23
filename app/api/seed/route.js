import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import Transaction from '@/models/Transaction';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireRole(['owner']);
    if (auth.response) return auth.response;

    await dbConnect();

    // Clear existing data
    await Client.deleteMany({});
    await Campaign.deleteMany({});
    await Transaction.deleteMany({});

    // Create Dummy Clients
    const clients = await Client.insertMany([
      { name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', companyName: 'Alice Tech' },
      { name: 'Bob Smith', email: 'bob@example.com', phone: '098-765-4321', companyName: 'Bob Ventures' },
      { name: 'Charlie Davis', email: 'charlie@example.com', phone: '555-555-5555', companyName: 'Charlie Media' },
    ]);

    // Create Dummy Campaigns
    await Campaign.create([
      { 
        name: 'Launch Promo', 
        client: clients[0]._id, 
        platform: 'Facebook', 
        dailyBudget: 50, 
        startDate: new Date('2024-01-01'), 
        endDate: new Date('2024-01-31'), 
        status: 'running' 
      },
      { 
        name: 'Google Search Ads', 
        client: clients[1]._id, 
        platform: 'Google', 
        dailyBudget: 100, 
        startDate: new Date('2024-02-01'), 
        endDate: new Date('2024-02-15'), 
        status: 'paused' 
      },
    ]);

    // Create Dummy Transactions
    await Transaction.create([
      { client: clients[0]._id, amount: 1500, note: 'Initial deposit' },
      { client: clients[1]._id, amount: 500, note: 'Partial payment' },
    ]);

    // Recalculate balances (manually for seed)
    for (const client of clients) {
      const campaigns = await Campaign.find({ client: client._id });
      const transactions = await Transaction.find({ client: client._id });
      const totalSpent = campaigns.reduce((sum, camp) => sum + camp.totalSpent, 0);
      const totalPaid = transactions.reduce((sum, trans) => sum + trans.amount, 0);
      await Client.findByIdAndUpdate(client._id, { balance: totalPaid - totalSpent });
    }

    return NextResponse.json({ message: 'Dummy data seeded successfully!' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
