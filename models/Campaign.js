import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  platform: { type: String, enum: ['Facebook', 'Google', 'TikTok'], required: true },
  dailyBudget: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['running', 'paused'], default: 'running' },
  totalBudget: { type: Number, default: 0 },
  runningSpend: { type: Number, default: 0 },
}, { timestamps: true });

// Pre-save hook to calculate budgets
CampaignSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.dailyBudget) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const now = new Date();
    
    const durationInMs = Math.max(0, end.getTime() - start.getTime());
    this.totalBudget = this.dailyBudget * (durationInMs / (1000 * 60 * 60 * 24));

    let daysPassed = 0;
    if (now > start) {
      const diffInMs = Math.min(now.getTime() - start.getTime(), end.getTime() - start.getTime());
      daysPassed = Math.max(0, diffInMs / (1000 * 60 * 60 * 24));
    }
    this.runningSpend = this.dailyBudget * daysPassed;
  }
  next();
});

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
