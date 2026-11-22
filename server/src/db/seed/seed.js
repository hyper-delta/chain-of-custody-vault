import bcrypt from 'bcryptjs';
import { sequelize } from '../sequelize.js';
import { Role, Permission, RolePermission, User, Item, StatusTransition, CustodyEvent } from '../models/index.js';
import { computeEventHash } from '../../lib/hash.js';

const permissions = ['item:create','item:read','custody:transfer','custody:receive','item:status_change','item:dispose','evidence:upload','custody:verify','audit:read','checkpoint:read'];
const grants = { Collector: ['item:create','item:read','custody:transfer','custody:receive','item:status_change','evidence:upload'], Analyst: ['item:read','custody:transfer','custody:receive','item:status_change','item:dispose','evidence:upload'], Auditor: ['item:read','custody:verify','audit:read','checkpoint:read'] };
const transitions = [['COLLECTED','IN_TRANSIT',null],['COLLECTED','STORED',null],['IN_TRANSIT','IN_ANALYSIS',null],['IN_TRANSIT','STORED',null],['IN_ANALYSIS','IN_TRANSIT',null],['IN_ANALYSIS','STORED',null],['IN_ANALYSIS','DISPOSED','item:dispose'],['STORED','IN_TRANSIT',null],['STORED','IN_ANALYSIS',null],['STORED','DISPOSED','item:dispose']];

export async function seedReferenceData() {
  await sequelize.sync({ alter: false });
  for (const code of permissions) await Permission.findOrCreate({ where: { code } });
  for (const [name, codes] of Object.entries(grants)) {
    const [role] = await Role.findOrCreate({ where: { name } });
    for (const code of codes) { const permission = await Permission.findOne({ where: { code } }); await RolePermission.findOrCreate({ where: { roleId: role.id, permissionId: permission.id } }); }
  }
  for (const [fromStatus,toStatus,requiredPermission] of transitions) await StatusTransition.findOrCreate({ where: { fromStatus, toStatus }, defaults: { requiredPermission } });
}

export async function seed() {
  await seedReferenceData();
  const demoPasswordHash = await bcrypt.hash('VaultDemo123!', Number(process.env.BCRYPT_ROUNDS) || 12);
  for (const [name, email, roleName] of [['Demo Collector','collector@vault.local','Collector'],['Demo Analyst','analyst@vault.local','Analyst'],['Demo Auditor','auditor@vault.local','Auditor']]) {
    const role = await Role.findOne({ where: { name: roleName } });
    await User.findOrCreate({ where: { email }, defaults: { name, passwordHash: demoPasswordHash, roleId: role.id, isActive: true } });
  }
  const collector = await User.findOne({ where: { email: 'collector@vault.local' } });
  const analyst = await User.findOne({ where: { email: 'analyst@vault.local' } });
  for (let i = 1; i <= Number(process.env.SEED_ITEMS) || 50; i++) {
    const itemCode = `SMP-2026-${String(i).padStart(6, '0')}`;
    const [item] = await Item.findOrCreate({ where: { itemCode }, defaults: { name: `Laboratory Sample ${i}`, description: 'Seeded chain sample', category: i % 3 === 0 ? 'EVIDENCE' : i % 3 === 1 ? 'SAMPLE' : 'EQUIPMENT', status: 'COLLECTED', currentCustodianId: i % 2 ? collector.id : analyst.id, headSeq: 1, headHash: '0'.repeat(64), createdBy: collector.id } });
    if (!(await CustodyEvent.findOne({ where: { itemId: item.id, seq: 1 } }))) {
      const occurredAt = new Date(Date.now() - i * 3600000); const prevHash = '0'.repeat(64);
      const eventHash = computeEventHash({ itemId: item.id, seq: 1, eventType: 'REGISTERED', actorId: collector.id, fromUserId: null, toUserId: item.currentCustodianId, fromStatus: null, toStatus: 'COLLECTED', evidenceSha256: null, reason: 'Initial seed registration', occurredAt, prevHash });
      await CustodyEvent.create({ itemId: item.id, seq: 1, eventType: 'REGISTERED', actorId: collector.id, fromUserId: null, toUserId: item.currentCustodianId, fromStatus: null, toStatus: 'COLLECTED', reason: 'Initial seed registration', occurredAt, prevHash, eventHash });
      await item.update({ headHash: eventHash });
    }
  }
  console.log('Seed complete');
}

seed().then(() => sequelize.close()).catch(async (error) => { console.error(error); await sequelize.close(); process.exit(1); });
