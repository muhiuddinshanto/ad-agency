import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import Transaction from '@/models/Transaction';
import Load from '@/models/Load';
import DailySpend from '@/models/DailySpend';
import dbConnect from './mongodb';

export async function recalculateBalance(clientId) {
  await dbConnect();
  
  const client = await Client.findById(clientId);
  if (!client) return;

  const campaigns = await Campaign.find({ client: clientId });
  const transactions = await Transaction.find({ client: clientId });
  const loads = await Load.find({ client: clientId });
  
  const dailySpends = await DailySpend.find({ client: clientId });
  
  let totalBudget = 0;
  let totalSpent = dailySpends.reduce((sum, ds) => sum + ds.amount, 0);
  let futureRemainingBudget = 0;

  const now = new Date();
  const todayStart = new Date(now.toISOString().split('T')[0]);

  for (const camp of campaigns) {
    const start = new Date(camp.startDate);
    const end = new Date(camp.endDate);
    
    const durationInMs = Math.max(0, end.getTime() - start.getTime());
    const totalDurationInDays = durationInMs / (1000 * 60 * 60 * 24);
    
    let campTotalBudget = 0;

    if (camp.type === 'lifetime') {
      campTotalBudget = camp.totalBudget;
      camp.dailyBudget = totalDurationInDays > 0 ? campTotalBudget / totalDurationInDays : 0;
    } else {
      campTotalBudget = (camp.dailyBudget || 0) * totalDurationInDays;
      camp.totalBudget = campTotalBudget;
    }
    
    totalBudget += campTotalBudget;

    // Running spend for this campaign specifically from DailySpend records
    const campDailySpends = dailySpends.filter(ds => ds.campaign.toString() === camp._id.toString());
    const campRunningSpend = campDailySpends.reduce((sum, ds) => sum + ds.amount, 0);
    camp.runningSpend = campRunningSpend;

    // Future Remaining Budget Calculation
    if (camp.status === 'running' && end > todayStart) {
      // Remaining days includes today if it's not over
      const remainingTime = Math.max(0, end.getTime() - Math.max(todayStart.getTime(), start.getTime()));
      const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
      
      if (camp.type === 'lifetime') {
        // Option A: (Total - Spent) or Option B: (Remaining Days * Daily Rate)
        // User said: Future Due = Remaining Days × Daily Rate
        futureRemainingBudget += remainingDays * camp.dailyBudget;
      } else {
        futureRemainingBudget += remainingDays * camp.dailyBudget;
      }
    }
    
    await camp.save();
  }

  const totalLoaded = loads.reduce((sum, load) => sum + (load.usdAmount || 0), 0);
  const totalPaid = transactions.reduce((sum, trans) => sum + (trans.usdAmount || 0), 0);
  
  // Requirement:
  // Campaign clients: balance = totalPaid - totalSpent (Running Spend)
  // Wallet clients: balance = totalPaid - totalLoaded
  let balance = 0;
  if (client.serviceType === 'wallet') {
    balance = totalPaid - totalLoaded;
  } else {
    balance = totalPaid - totalSpent;
  }
  
  // Future Due is ONLY a projection for the UI, not stored in DB
  const futureDue = futureRemainingBudget;

  await Client.findByIdAndUpdate(clientId, {
    totalBudget,
    totalSpent,
    totalLoaded,
    totalPaid,
    balance
  });

  return { totalBudget, totalSpent, totalLoaded, totalPaid, balance, futureDue };
}
