import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import Transaction from '@/models/Transaction';
import Load from '@/models/Load';
import DailySpend from '@/models/DailySpend';
import dbConnect from './mongodb';

/**
 * SINGLE SOURCE OF TRUTH BALANCE CALCULATOR
 * This is the ONLY function allowed to modify client financial balances.
 * It sums raw data from the 3 source collections: Campaigns, Transactions, DailySpend (and Loads).
 */
export async function recalculateBalance(clientId) {
  await dbConnect();
  
  const campaigns = await Campaign.find({ client: clientId });
  const transactions = await Transaction.find({ client: clientId });
  const loads = await Load.find({ client: clientId });
  const dailySpends = await DailySpend.find({ client: clientId });
  
  // 1. Total Budget (Sum of Campaign totalBudget)
  const totalBudget = campaigns.reduce((sum, camp) => sum + (camp.totalBudget || 0), 0);

  // 2. Running Spend (Sum of DailySpend)
  const totalSpent = dailySpends.reduce((sum, ds) => sum + (ds.amount || 0), 0);

  // 3. Total Paid (Sum of Transactions locked usdAmount)
  const totalPaid = transactions.reduce((sum, trans) => sum + (trans.usdAmount || 0), 0);

  // 4. Total Loaded (Sum of Loads for Wallet clients)
  const totalLoaded = loads.reduce((sum, load) => sum + (load.usdAmount || 0), 0);

  // 5. LEDGER DEFINITIONS (Strict)
  const dueAmount = totalSpent - totalPaid;
  const futureRemaining = totalBudget - totalPaid;
  const walletBalance = totalLoaded - totalPaid;

  // Update Client document (The only place we store these sums)
  const client = await Client.findByIdAndUpdate(clientId, {
    totalBudget,
    totalSpent,
    totalPaid,
    totalLoaded,
    contractDue: dueAmount, // Unified field for 'Due Amount'
    walletBalance,
    // Legacy/Combined balance field (optional cleanup)
    balance: dueAmount 
  }, { new: true });

  return {
    totalBudget,
    totalSpent,
    totalPaid,
    totalLoaded,
    dueAmount,
    futureRemaining,
    walletBalance,
    isOverdrawn: walletBalance < 0
  };
}

// reconcileClientFinance is removed to keep system simple and deterministic.
