import crypto from 'node:crypto';

export function computeEventHash({
  itemId,
  seq,
  eventType,
  actorId,
  fromUserId,
  toUserId,
  fromStatus,
  toStatus,
  evidenceSha256,
  reason,
  occurredAt,
  prevHash,
}) {
  const payload = [
    itemId,
    seq,
    eventType,
    actorId,
    fromUserId,
    toUserId,
    fromStatus,
    toStatus,
    evidenceSha256,
    reason,
    new Date(occurredAt).toISOString(),
    prevHash,
  ];
  return crypto.createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
}

export const sha256 = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');
