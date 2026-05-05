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
      campTotalBudget = camp.dailyBudget * totalDurationInDays;
      camp.totalBudget = campTotalBudget;
    }
    
    totalBudget += campTotalBudget;

    // Running spend for this campaign specifically
    const campDailySpends = dailySpends.filter(ds => ds.campaign.toString() === camp._id.toString());
    camp.runningSpend = campDailySpends.reduce((sum, ds) => sum + ds.amount, 0);
    
    await camp.save();
  }

  const totalLoaded = loads.reduce((sum, load) => sum + (load.usdAmount || 0), 0);
  const totalPaid = transactions.reduce((sum, trans) => sum + (trans.usdAmount || 0), 0);
  
  // Requirement:
  // Campaign clients: balance = totalPaid - totalSpent
  // Wallet clients: balance = totalPaid - totalLoaded
  let balance = 0;
  if (client.serviceType === 'wallet') {
    balance = totalPaid - totalLoaded;
  } else {
    balance = totalPaid - totalSpent;
  }
  
  const futureDue = totalBudget - totalPaid;

  await Client.findByIdAndUpdate(clientId, {
    totalBudget,
    totalSpent,
    totalLoaded,
    totalPaid,
    balance,
    futureDue
  });

  return { totalBudget, totalSpent, totalLoaded, totalPaid, balance, futureDue };
}
