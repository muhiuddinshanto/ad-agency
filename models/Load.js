import mongoose from 'mongoose';

const LoadSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  usdAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
}, { timestamps: true });

export default mongoose.models.Load || mongoose.model('Load', LoadSchema);
