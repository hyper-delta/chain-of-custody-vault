import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class CustodyEvent extends Model {}
CustodyEvent.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  itemId: { type: DataTypes.INTEGER, allowNull: false, field: 'item_id' },
  seq: { type: DataTypes.INTEGER, allowNull: false },
  eventType: { type: DataTypes.STRING(32), allowNull: false, field: 'event_type' },
  actorId: { type: DataTypes.INTEGER, allowNull: false, field: 'actor_id' },
  fromUserId: { type: DataTypes.INTEGER, allowNull: true, field: 'from_user_id' },
  toUserId: { type: DataTypes.INTEGER, allowNull: true, field: 'to_user_id' },
  fromStatus: { type: DataTypes.STRING(32), allowNull: true, field: 'from_status' },
  toStatus: { type: DataTypes.STRING(32), allowNull: true, field: 'to_status' },
  evidenceId: { type: DataTypes.INTEGER, allowNull: true, field: 'evidence_id' },
  evidenceSha256: { type: DataTypes.STRING(64), allowNull: true, field: 'evidence_sha256' },
  reason: { type: DataTypes.STRING(500), allowNull: true },
  occurredAt: { type: DataTypes.DATE(3), allowNull: false, field: 'occurred_at' },
  prevHash: { type: DataTypes.STRING(64), allowNull: false, field: 'prev_hash' },
  eventHash: { type: DataTypes.STRING(64), allowNull: false, field: 'event_hash' },
}, { sequelize, modelName: 'CustodyEvent', tableName: 'custody_events', underscored: true, timestamps: false, indexes: [{ unique: true, fields: ['item_id', 'seq'] }, { fields: ['occurred_at'] }, { fields: ['to_user_id', 'occurred_at'] }] });

export class EvidenceFile extends Model {}
EvidenceFile.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  itemId: { type: DataTypes.INTEGER, allowNull: false, field: 'item_id' },
  uploadedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'uploaded_by' },
  uploadedAt: { type: DataTypes.DATE(3), allowNull: false, field: 'uploaded_at', defaultValue: DataTypes.NOW },
  originalName: { type: DataTypes.STRING(255), allowNull: false, field: 'original_name' },
  mimeType: { type: DataTypes.STRING(128), allowNull: false, field: 'mime_type' },
  sizeBytes: { type: DataTypes.INTEGER, allowNull: false, field: 'size_bytes' },
  sha256: { type: DataTypes.STRING(64), allowNull: false },
  content: { type: DataTypes.BLOB, allowNull: false },
}, { sequelize, modelName: 'EvidenceFile', tableName: 'evidence_files', underscored: true, timestamps: false, indexes: [{ fields: ['item_id'] }] });
