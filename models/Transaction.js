import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  platform: { type: String, enum: ['Facebook', 'Google', 'TikTok', 'General'], default: 'General' },
  bdtAmount: { type: Number, required: true },
  usdAmount: { type: Number, required: true },
  rateAtTime: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
