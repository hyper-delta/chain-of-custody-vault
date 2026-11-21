import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Role extends Model {}
Role.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(32), allowNull: false, unique: true },
}, { sequelize, modelName: 'Role', tableName: 'roles', underscored: true, timestamps: false });

export class Permission extends Model {}
Permission.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
}, { sequelize, modelName: 'Permission', tableName: 'permissions', underscored: true, timestamps: false });

export class RolePermission extends Model {}
RolePermission.init({
  roleId: { type: DataTypes.INTEGER, primaryKey: true, field: 'role_id' },
  permissionId: { type: DataTypes.INTEGER, primaryKey: true, field: 'permission_id' },
}, { sequelize, modelName: 'RolePermission', tableName: 'role_permissions', underscored: true, timestamps: false });
