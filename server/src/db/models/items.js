import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class StatusTransition extends Model {}
StatusTransition.init({
  fromStatus: { type: DataTypes.STRING(32), primaryKey: true, field: 'from_status' },
  toStatus: { type: DataTypes.STRING(32), primaryKey: true, field: 'to_status' },
  requiredPermission: { type: DataTypes.STRING(64), allowNull: true, field: 'required_permission' },
}, { sequelize, modelName: 'StatusTransition', tableName: 'status_transitions', underscored: true, timestamps: false });

export class Item extends Model {}
Item.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  itemCode: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: 'item_code' },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING(32), allowNull: false },
  status: { type: DataTypes.STRING(32), allowNull: false },
  currentCustodianId: { type: DataTypes.INTEGER, allowNull: false, field: 'current_custodian_id' },
  headSeq: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'head_seq', validate: { min: 1 } },
  headHash: { type: DataTypes.STRING(64), allowNull: false, field: 'head_hash' },
  createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
}, { sequelize, modelName: 'Item', tableName: 'items', underscored: true, createdAt: 'created_at', updatedAt: 'updated_at' });
