import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import Transaction from '@/models/Transaction';
import Load from '@/models/Load';
import DailySpend from '@/models/DailySpend';
import { requireRole } from '@/lib/permissions';
import { recalculateBalance } from '@/lib/balance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED_ROUTE !== 'true') {
      return NextResponse.json({ error: 'Seed route is disabled in production.' }, { status: 404 });
    }

    const auth = await requireRole(['owner']);
    if (auth.response) return auth.response;

    await dbConnect();

    // Clear existing data
    await Client.deleteMany({});
    await Campaign.deleteMany({});
    await Transaction.deleteMany({});
    await Load.deleteMany({});
    await DailySpend.deleteMany({});

    // Create Dummy Clients
    const clients = await Client.insertMany([
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '123-456-7890',
        companyName: 'Alice Tech',
        ratePerDollar: 120,
        rates: { Facebook: 120, Google: 121, TikTok: 119 },
        serviceType: 'campaign',
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '098-765-4321',
        companyName: 'Bob Ventures',
        ratePerDollar: 120,
        rates: { Facebook: 120, Google: 121, TikTok: 119 },
        serviceType: 'campaign',
      },
      {
        name: 'Charlie Davis',
        email: 'charlie@example.com',
        phone: '555-555-5555',
        companyName: 'Charlie Media',
        ratePerDollar: 120,
        rates: { Facebook: 120, Google: 121, TikTok: 119 },
        serviceType: 'wallet',
      },
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
      { client: clients[0]._id, platform: 'Facebook', bdtAmount: 180000, usdAmount: 1500, rateAtTime: 120, note: 'Initial deposit' },
      { client: clients[1]._id, platform: 'Google', bdtAmount: 60500, usdAmount: 500, rateAtTime: 121, note: 'Partial payment' },
    ]);

    for (const client of clients) {
      await recalculateBalance(client._id);
    }

    return NextResponse.json({ message: 'Dummy data seeded successfully!' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
