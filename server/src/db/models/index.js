import { Role, Permission, RolePermission } from './rbac.js';
import { User, RefreshToken } from './auth.js';
import { Item, StatusTransition } from './items.js';
import { CustodyEvent, EvidenceFile } from './custody.js';

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });
Item.belongsTo(User, { foreignKey: 'current_custodian_id', as: 'currentCustodian' });
Item.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Item.hasMany(CustodyEvent, { foreignKey: 'item_id', as: 'events' });
CustodyEvent.belongsTo(Item, { foreignKey: 'item_id' });
CustodyEvent.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });
Item.hasMany(EvidenceFile, { foreignKey: 'item_id', as: 'evidenceFiles' });
EvidenceFile.belongsTo(Item, { foreignKey: 'item_id' });
EvidenceFile.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

export { Role, Permission, RolePermission, User, RefreshToken, Item, StatusTransition, CustodyEvent, EvidenceFile };
