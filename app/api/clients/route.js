import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const clients = await Client.find({}).sort({ createdAt: -1 });
    return NextResponse.json(clients);
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
