import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Load from '@/models/Load';
import { recalculateBalance } from '@/lib/balance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const loads = await Load.find({}).populate('client').sort({ createdAt: -1 });
    return NextResponse.json(loads);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const load = await Load.create({
      client: body.client,
      usdAmount: parseFloat(body.usdAmount),
      date: body.date || new Date(),
      note: body.note
    });
    
    await recalculateBalance(load.client);
    
    return NextResponse.json(load, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
