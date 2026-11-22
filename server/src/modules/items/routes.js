import crypto from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { Op } from 'sequelize';
import { Item, CustodyEvent, EvidenceFile, User, Role, Permission } from '../../db/models/index.js';
import { appendEvent, transferItem } from '../custody/service.js';
import { authenticate, requirePermission } from '../../middleware/authenticate.js';
import { evidenceUpload } from '../../middleware/upload.js';
import { asyncHandler } from '../../lib/pagination.js';
import { paginate } from '../../lib/pagination.js';
import { AppError } from '../../lib/errors.js';
import { sha256, computeEventHash } from '../../lib/hash.js';

const idParam = z.coerce.number().int().positive();
const itemCreate = z.object({ body: z.object({ name: z.string().trim().min(2).max(200), description: z.string().max(2000).optional(), category: z.enum(['SAMPLE', 'EVIDENCE', 'EQUIPMENT']), reason: z.string().max(500).optional() }), query: z.object({}).passthrough(), params: z.object({}).passthrough() });
const expectedBody = z.object({ body: z.object({ expectedSeq: z.number().int().positive(), reason: z.string().max(500).optional() }).passthrough(), query: z.object({}).passthrough(), params: z.object({ id: z.coerce.number().int().positive() }) });

export function itemRoutes(validate) {
  const router = express.Router();
  router.get('/users/recipients', authenticate, requirePermission('custody:transfer'), asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const users = await User.findAll({ include: [{ model: Role, as: 'role' }], where: { isActive: true, id: { [Op.ne]: req.user.id }, ...(q ? { name: { [Op.iLike]: `%${q}%` } } : {}) }, limit: 100 });
    const eligible = [];
    for (const user of users) { const permissions = await user.role.getPermissions({ through: { attributes: [] } }); if (permissions.some((p) => p.code === 'custody:receive')) eligible.push({ id: user.id, name: user.name, role: user.role.name }); }
    res.json({ data: eligible });
  }));
  router.post('/items', authenticate, requirePermission('item:create'), validate(itemCreate), asyncHandler(async (req, res) => {
    const ItemCode = `SMP-2026-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const item = await Item.create({ itemCode: ItemCode, name: req.validated.body.name, description: req.validated.body.description || null, category: req.validated.body.category, status: 'COLLECTED', currentCustodianId: req.user.id, headSeq: 1, headHash: '0'.repeat(64), createdBy: req.user.id });
    const eventHash = computeEventHash({ itemId: item.id, seq: 1, eventType: 'REGISTERED', actorId: req.user.id, fromUserId: null, toUserId: req.user.id, fromStatus: null, toStatus: 'COLLECTED', evidenceSha256: null, reason: req.validated.body.reason || null, occurredAt: new Date(), prevHash: '0'.repeat(64) });
    const occurredAt = new Date();
    await CustodyEvent.create({ itemId: item.id, seq: 1, eventType: 'REGISTERED', actorId: req.user.id, fromUserId: null, toUserId: req.user.id, fromStatus: null, toStatus: 'COLLECTED', reason: req.validated.body.reason || null, occurredAt, prevHash: '0'.repeat(64), eventHash });
    await item.update({ headHash: eventHash });
    res.status(201).location(`/api/v1/items/${item.id}`).json(item);
  }));
  router.get('/items', authenticate, requirePermission('item:read'), asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = paginate(req.query.page, req.query.pageSize);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.category = req.query.category;
    if (req.query.custodianId) where.currentCustodianId = Number(req.query.custodianId);
    if (req.query.mine === 'true') where.currentCustodianId = req.user.id;
    if (req.query.q) where[Op.or] = [{ itemCode: { [Op.iLike]: `${req.query.q}%` } }, { name: { [Op.iLike]: `%${req.query.q}%` } }];
    const allowedSort = { created_at: 'createdAt', item_code: 'itemCode', status: 'status' };
    const sort = allowedSort[req.query.sort] || 'createdAt';
    const order = String(req.query.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const { rows, count } = await Item.findAndCountAll({ where, offset, limit: pageSize, order: [[sort, order]], include: [{ model: User, as: 'currentCustodian', attributes: ['id', 'name'] }] });
    res.json({ data: rows, meta: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) } });
  }));
  router.get('/items/:id', authenticate, requirePermission('item:read'), asyncHandler(async (req, res) => {
    const item = await Item.findByPk(req.params.id, { include: [{ model: User, as: 'currentCustodian', attributes: ['id', 'name'] }] });
    if (!item) throw new AppError('NOT_FOUND', 404, 'Item not found.');
    res.json(item);
  }));
  router.get('/items/:id/events', authenticate, requirePermission('item:read'), asyncHandler(async (req, res) => {
    if (!(await Item.findByPk(req.params.id))) throw new AppError('NOT_FOUND', 404, 'Item not found.');
    const { page, pageSize, offset } = paginate(req.query.page, req.query.pageSize);
    const { rows, count } = await CustodyEvent.findAndCountAll({ where: { itemId: req.params.id }, offset, limit: pageSize, order: [['seq', 'ASC']] });
    res.json({ data: rows, meta: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) } });
  }));
  router.post('/items/:id/transfer', authenticate, requirePermission('custody:transfer'), validate(expectedBody), asyncHandler(async (req, res) => {
    const event = await transferItem({ itemId: Number(req.params.id), actorId: req.user.id, permissions: req.permissions, toUserId: req.validated.body.toUserId, toStatus: req.validated.body.toStatus, reason: req.validated.body.reason, expectedSeq: req.validated.body.expectedSeq });
    res.status(201).json(event);
  }));
  router.post('/items/:id/status', authenticate, requirePermission('item:status_change'), validate(expectedBody), asyncHandler(async (req, res) => {
    res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Status change endpoint pending.', details: null, requestId: req.requestId } });
  }));
  router.post('/items/:id/evidence', authenticate, requirePermission('evidence:upload'), evidenceUpload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('VALIDATION_ERROR', 422, 'A file is required.', [{ path: 'file', message: 'Choose a file.' }]);
    const item = await Item.findByPk(req.params.id); if (!item) throw new AppError('NOT_FOUND', 404, 'Item not found.');
    if (item.currentCustodianId !== req.user.id) throw new AppError('NOT_CUSTODIAN', 403, 'Only the current custodian can perform this action.');
    const hash = sha256(req.file.buffer);
    const evidence = await EvidenceFile.create({ itemId: item.id, uploadedBy: req.user.id, originalName: req.file.originalname, mimeType: req.file.mimetype, sizeBytes: req.file.size, sha256: hash, content: req.file.buffer });
    const event = await appendEvent({ transaction: await item.sequelize.transaction(), lockedItem: item, eventType: 'EVIDENCE_ADDED', actorId: req.user.id, evidence: { id: evidence.id, sha256: hash }, reason: req.body.reason || null });
    res.status(201).json({ data: evidence, event });
  }));
  router.get('/items/:id/evidence', authenticate, requirePermission('item:read'), asyncHandler(async (req, res) => {
    const data = await EvidenceFile.findAll({ where: { itemId: req.params.id }, attributes: { exclude: ['content'] }, order: [['uploaded_at', 'DESC']] });
    res.json({ data });
  }));
  router.get('/evidence/:id/download', authenticate, requirePermission('item:read'), asyncHandler(async (req, res) => {
    const evidence = await EvidenceFile.findByPk(req.params.id); if (!evidence) throw new AppError('NOT_FOUND', 404, 'Evidence not found.');
    if (sha256(evidence.content) !== evidence.sha256) throw new AppError('EVIDENCE_CORRUPT', 500, 'Evidence integrity check failed.');
    res.setHeader('Content-Type', evidence.mimeType).setHeader('Content-Disposition', `attachment; filename="${evidence.originalName}"`).send(evidence.content);
  }));
  router.get('/items/:id/verify', authenticate, requirePermission('custody:verify'), asyncHandler(async (req, res) => {
    const item = await Item.findByPk(req.params.id); if (!item) throw new AppError('NOT_FOUND', 404, 'Item not found.');
    const events = await CustodyEvent.findAll({ where: { itemId: item.id }, order: [['seq', 'ASC']] });
    let previousHash = '0'.repeat(64);
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.seq !== i + 1) return res.json({ valid: false, eventsChecked: i, firstBrokenSeq: event.seq, reason: 'SEQ_GAP' });
      if (event.prevHash !== previousHash) return res.json({ valid: false, eventsChecked: i + 1, firstBrokenSeq: event.seq, reason: 'PREV_HASH_MISMATCH' });
      const recomputed = computeEventHash({ itemId: event.itemId, seq: event.seq, eventType: event.eventType, actorId: event.actorId, fromUserId: event.fromUserId, toUserId: event.toUserId, fromStatus: event.fromStatus, toStatus: event.toStatus, evidenceSha256: event.evidenceSha256, reason: event.reason, occurredAt: event.occurredAt, prevHash: event.prevHash });
      if (recomputed !== event.eventHash) return res.json({ valid: false, eventsChecked: i + 1, firstBrokenSeq: event.seq, reason: 'HASH_MISMATCH' });
      previousHash = event.eventHash;
    }
    if (item.headSeq !== (events.at(-1)?.seq || 0) || item.headHash !== (events.at(-1)?.eventHash || '')) return res.json({ valid: false, eventsChecked: events.length, firstBrokenSeq: item.headSeq, reason: 'HEAD_MISMATCH' });
    res.json({ valid: true, eventsChecked: events.length });
  }));
  return router;
}
