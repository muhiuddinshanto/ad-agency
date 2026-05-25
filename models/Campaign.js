import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  platform: { type: String, enum: ['Facebook', 'Google', 'TikTok'], required: true },
  type: { type: String, enum: ['daily', 'lifetime'], default: 'daily' },
  dailyBudget: { type: Number }, // Optional if lifetime
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['running', 'paused'], default: 'running' },
  totalBudget: { type: Number, default: 0 },
  runningSpend: { type: Number, default: 0 },
  manualSpendOverride: { type: Number },
}, { timestamps: true });

function getInclusiveDurationInDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(1, Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1);
}

// Pre-save hook to calculate budgets
CampaignSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const durationInDays = getInclusiveDurationInDays(this.startDate, this.endDate);

    if (this.type === 'daily') {
      this.totalBudget = (this.dailyBudget || 0) * durationInDays;
    } else if (this.type === 'lifetime') {
      // For lifetime, totalBudget is provided, dailyBudget is derived
      this.dailyBudget = durationInDays > 0 ? this.totalBudget / durationInDays : 0;
    }
  }
  next();
});

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
