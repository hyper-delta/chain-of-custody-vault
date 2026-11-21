import mongoose from 'mongoose';

const AccessLogSchema = new mongoose.Schema({
  ts: { type: Date, default: Date.now, required: true },
  userId: { type: String },
  role: { type: String },
  action: { type: String, required: true },
  itemId: { type: String },
  evidenceId: { type: String },
  ip: { type: String },
  requestId: { type: String },
  userAgent: { type: String },
  outcome: { type: String, required: true },
}, { versionKey: false });

AccessLogSchema.index({ itemId: 1, ts: -1 });
AccessLogSchema.index({ userId: 1, ts: -1 });
AccessLogSchema.index({ ts: -1 });

export const AccessLog = mongoose.models.AccessLog || mongoose.model('AccessLog', AccessLogSchema);
