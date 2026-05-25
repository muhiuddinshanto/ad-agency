import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  companyName: { type: String, required: true },
  ratePerDollar: { type: Number, required: true }, // Legacy/Fallback
  rates: {
    Facebook: { type: Number, default: 120 },
    Google: { type: Number, default: 120 },
    TikTok: { type: Number, default: 120 }
  },
  serviceType: { type: String, enum: ['campaign', 'wallet'], default: 'campaign' },
  totalBudget: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalLoaded: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }, // Legacy/Combined
  contractDue: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
