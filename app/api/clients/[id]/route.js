import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import Transaction from '@/models/Transaction';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const client = await Client.findById(params.id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Use findById and manual update to ensure nested objects like 'rates' are updated correctly
    const client = await Client.findById(params.id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Update basic fields
    if (body.name) client.name = body.name;
    if (body.email) client.email = body.email;
    if (body.phone) client.phone = body.phone;
    if (body.companyName) client.companyName = body.companyName;
    if (body.ratePerDollar) client.ratePerDollar = body.ratePerDollar;
    
    // Update rates object explicitly
    if (body.rates) {
      client.rates = {
        Facebook: body.rates.Facebook || client.rates.Facebook,
        Google: body.rates.Google || client.rates.Google,
        TikTok: body.rates.TikTok || client.rates.TikTok
      };
    }

    await client.save();
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const client = await Client.findByIdAndDelete(params.id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    
    // Optional: Clean up related campaigns and transactions
    await Campaign.deleteMany({ client: params.id });
    await Transaction.deleteMany({ client: params.id });
    
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
