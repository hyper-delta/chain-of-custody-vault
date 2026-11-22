import crypto from 'node:crypto';
import { Transaction } from 'sequelize';
import { sequelize } from '../../db/sequelize.js';
import { Item, CustodyEvent, EvidenceFile, StatusTransition, User } from '../../db/models/index.js';
import { computeEventHash } from '../../lib/hash.js';
import { AppError } from '../../lib/errors.js';

export async function appendEvent(options) {
  const { transaction, lockedItem, eventType, actorId, toUserId = null, toStatus = null, fromStatus = null, evidence = null, reason = null } = options;
  const occurredAt = new Date();
  const seq = lockedItem.headSeq + 1;
  const prevHash = lockedItem.headHash;
  const fromUserId = eventType === 'REGISTERED' ? null : lockedItem.currentCustodianId;
  const evidenceSha256 = evidence?.sha256 || null;
  const eventHash = computeEventHash({ itemId: lockedItem.id, seq, eventType, actorId, fromUserId, toUserId: toUserId ?? fromUserId, fromStatus, toStatus, evidenceSha256, reason, occurredAt, prevHash });
  const event = await CustodyEvent.create({ itemId: lockedItem.id, seq, eventType, actorId, fromUserId, toUserId: toUserId ?? fromUserId, fromStatus, toStatus, evidenceId: evidence?.id || null, evidenceSha256, reason, occurredAt, prevHash, eventHash }, { transaction });
  await lockedItem.update({ status: toStatus ?? lockedItem.status, currentCustodianId: toUserId ?? lockedItem.currentCustodianId, headSeq: seq, headHash: eventHash }, { transaction });
  return event;
}

export async function transferItem({ itemId, actorId, permissions, toUserId, toStatus, reason, expectedSeq }) {
  return sequelize.transaction({ isolation: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (transaction) => {
    const item = await Item.findByPk(itemId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!item) throw new AppError('NOT_FOUND', 404, 'Item not found.');
    if (item.headSeq !== expectedSeq) throw new AppError('STALE_ITEM', 409, 'Item changed since you loaded it. Reload and retry.');
    if (item.status === 'DISPOSED') throw new AppError('ITEM_DISPOSED', 409, 'Disposed items cannot be transferred.');
    if (item.currentCustodianId !== actorId) throw new AppError('NOT_CUSTODIAN', 403, 'Only the current custodian can perform this action.');
    const recipient = await User.findByPk(toUserId, { transaction });
    if (!recipient || !recipient.isActive || recipient.id === actorId) throw new AppError('INVALID_RECIPIENT', 422, 'Recipient is invalid or unavailable.', [{ path: 'body.toUserId', message: 'Choose a valid recipient.' }]);
    const recipientRole = await recipient.getRole({ transaction });
    const recipientPermissions = await recipientRole.getPermissions({ through: { attributes: [] }, transaction });
    if (!recipientPermissions.some((p) => p.code === 'custody:receive')) throw new AppError('INVALID_RECIPIENT', 422, 'Recipient is not eligible to receive custody.');

    let nextStatus = item.status;
    if (toStatus && toStatus !== item.status) {
      const transition = await StatusTransition.findOne({ where: { fromStatus: item.status, toStatus }, transaction });
      if (!transition) throw new AppError('INVALID_TRANSITION', 409, 'This status transition is not allowed.');
      if (transition.requiredPermission && !permissions.has(transition.requiredPermission)) throw new AppError('FORBIDDEN', 403, 'The transition requires an additional permission.');
      nextStatus = toStatus;
    }
    return appendEvent({ transaction, lockedItem: item, eventType: 'TRANSFERRED', actorId, toUserId: recipient.id, toStatus: nextStatus, fromStatus: item.status, reason });
  }).catch((error) => {
    if (error?.name === 'SequelizeUniqueConstraintError') throw new AppError('STALE_ITEM', 409, 'Item changed since you loaded it. Reload and retry.');
    throw error;
  });
}
