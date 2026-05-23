import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  role: { type: String, enum: ['owner', 'admin', 'accountant'], required: true },
  targetId: { type: String },
  oldValues: { type: mongoose.Schema.Types.Mixed },
  newValues: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
