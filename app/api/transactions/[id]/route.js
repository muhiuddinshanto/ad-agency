import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { recalculateBalance } from '@/lib/balance';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const transaction = await Transaction.findById(params.id);
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    
    const clientId = transaction.client;
    await Transaction.findByIdAndDelete(params.id);
    
    // Auto update client balance
    await recalculateBalance(clientId);
    
    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
