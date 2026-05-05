import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';

import { recalculateBalance } from '@/lib/balance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const clients = await Client.find({});
    
    const results = [];
    for (const client of clients) {
      const balanceData = await recalculateBalance(client._id);
      const clientObj = client.toObject();
      results.push({
        ...clientObj,
        ...balanceData
      });
    }
    
    // Sort by createdAt desc
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const client = await Client.create(body);
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
