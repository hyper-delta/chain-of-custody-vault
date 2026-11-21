import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class User extends Model {}
User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, set(value) { this.setDataValue('email', String(value).toLowerCase().trim()); } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  roleId: { type: DataTypes.INTEGER, allowNull: false, field: 'role_id' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
}, { sequelize, modelName: 'User', tableName: 'users', underscored: true, createdAt: 'created_at', updatedAt: false });

export class RefreshToken extends Model {}
RefreshToken.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: 'token_hash' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  revokedAt: { type: DataTypes.DATE, allowNull: true, field: 'revoked_at' },
}, { sequelize, modelName: 'RefreshToken', tableName: 'refresh_tokens', underscored: true, createdAt: 'created_at', updatedAt: false });
