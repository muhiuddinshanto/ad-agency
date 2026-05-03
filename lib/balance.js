import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import Transaction from '@/models/Transaction';
import dbConnect from './mongodb';

export async function recalculateBalance(clientId) {
  await dbConnect();
  
  const client = await Client.findById(clientId);
  if (!client) return;

  const campaigns = await Campaign.find({ client: clientId });
  const transactions = await Transaction.find({ client: clientId });
  
  let totalBudget = 0;
  let totalSpent = 0;

  for (const camp of campaigns) {
    const start = new Date(camp.startDate);
    const end = new Date(camp.endDate);
    
    const durationInMs = Math.max(0, end.getTime() - start.getTime());
    const totalDurationInDays = durationInMs / (1000 * 60 * 60 * 24);
    const campTotalBudget = camp.dailyBudget * totalDurationInDays;
    totalBudget += campTotalBudget;

    let daysPassed = 0;
    const now = new Date();
    if (now > start) {
      const diffInMs = Math.min(now.getTime() - start.getTime(), end.getTime() - start.getTime());
      daysPassed = Math.max(0, diffInMs / (1000 * 60 * 60 * 24));
    }
    
    const runningSpend = camp.dailyBudget * daysPassed;
    totalSpent += runningSpend;

    // Update campaign record as well for individual view
    camp.totalBudget = campTotalBudget;
    camp.runningSpend = runningSpend;
    await camp.save();
  }

  const totalPaid = transactions.reduce((sum, trans) => sum + (trans.usdAmount || 0), 0);
  const balance = totalPaid - totalSpent;
  const futureDue = totalBudget - totalPaid;

  await Client.findByIdAndUpdate(clientId, {
    totalBudget,
    totalSpent,
    totalPaid,
    balance,
    futureDue
  });

  return { totalBudget, totalSpent, totalPaid, balance, futureDue };
}
