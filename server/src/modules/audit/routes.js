import express from 'express';
import { authenticate, requirePermission } from '../../middleware/authenticate.js';
import { AccessLog } from '../../db/models/AccessLog.js';
import { asyncHandler } from '../../lib/pagination.js';

export function auditRoutes() {
  const router = express.Router();
  router.get('/access-logs', authenticate, requirePermission('audit:read'), asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const filter = {};
    if (req.query.itemId) filter.itemId = req.query.itemId;
    if (req.query.userId) filter.userId = req.query.userId;
    const [data, total] = await Promise.all([AccessLog.find(filter).sort({ ts: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(), AccessLog.countDocuments(filter)]);
    res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  }));
  return router;
}
