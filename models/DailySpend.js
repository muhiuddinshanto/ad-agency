import mongoose from 'mongoose';

const DailySpendSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  date: { type: Date, required: true }, // Format: YYYY-MM-DD (start of day)
  amount: { type: Number, required: true },
}, { timestamps: true });

// Ensure unique entry per campaign per day
DailySpendSchema.index({ campaign: 1, date: 1 }, { unique: true });

export default mongoose.models.DailySpend || mongoose.model('DailySpend', DailySpendSchema);
