import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Op } from 'sequelize';
import { User, RefreshToken, Role } from '../../db/models/index.js';
import { asyncHandler } from '../../lib/pagination.js';
import { AppError } from '../../lib/errors.js';
import { authenticate } from '../../middleware/authenticate.js';

const registerSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(255), password: z.string().min(8).max(128) }), query: z.object({}).passthrough(), params: z.object({}).passthrough() });
const loginSchema = z.object({ body: z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) }), query: z.object({}).passthrough(), params: z.object({}).passthrough() });

function signAccess(user) {
  return jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' });
}

function newRefreshToken() {
  const raw = crypto.randomBytes(48).toString('base64url');
  const ttl = process.env.REFRESH_TOKEN_TTL || '7d';
  const days = ttl.endsWith('d') ? Number(ttl.slice(0, -1)) : 7;
  return { raw, hash: sha256(raw), expiresAt: new Date(Date.now() + days * 86400000) };
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function authResponse(user) {
  const role = await user.getRole();
  const permissions = await role.getPermissions({ through: { attributes: [] } });
  const refresh = newRefreshToken();
  await RefreshToken.create({ userId: user.id, tokenHash: refresh.hash, expiresAt: refresh.expiresAt });
  return { accessToken: signAccess(user), refreshToken: refresh.raw, user: { id: user.id, name: user.name, role: role.name, permissions: permissions.map((item) => item.code) } };
}

export function authRoutes(validate) {
  const router = (awaitImportExpress()).Router();
  router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
    const email = req.validated.body.email.toLowerCase();
    const exists = await User.findOne({ where: { email }, attributes: ['id'] });
    if (exists) throw new AppError('EMAIL_TAKEN', 409, 'Email address is already registered.');
    const collector = await Role.findOne({ where: { name: 'Collector' } });
    if (!collector) throw new AppError('SEED_REQUIRED', 500, 'Role reference data has not been seeded.');
    const passwordHash = await bcrypt.hash(req.validated.body.password, Number(process.env.BCRYPT_ROUNDS) || 12);
    const user = await User.create({ name: req.validated.body.name, email, passwordHash, roleId: collector.id });
    res.status(201).json(await authResponse(user));
  }));
  router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
    const user = await User.findOne({ where: { email: req.validated.body.email.toLowerNull?.() ?? req.validated.body.email.toLowerCase() }, include: [{ model: Role, as: 'role' }] });
    if (!user || !user.isActive || !(await bcrypt.compare(req.validated.body.password, user.passwordHash))) {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid email or password.');
    }
    res.json(await authResponse(user));
  }));
  router.post('/refresh', asyncHandler(async (req, res) => {
    const raw = req.body.refreshToken;
    if (!raw) throw new AppError('UNAUTHORIZED', 401, 'Refresh token is required.');
    const record = await RefreshToken.findOne({ where: { tokenHash: sha256(raw), revokedAt: null, expiresAt: { [Op.gt]: new Date() } } });
    if (!record) throw new AppError('UNAUTHORIZED', 401, 'Refresh token is invalid or expired.');
    await record.update({ revokedAt: new Date() });
    const user = await User.findByPk(record.userId);
    if (!user || !user.isActive) throw new AppError('UNAUTHORIZED', 401, 'User is unavailable.');
    res.json(await authResponse(user));
  }));
  router.post('/logout', authenticate, asyncHandler(async (req, res) => {
    await RefreshToken.update({ revokedAt: new Date() }, { where: { userId: req.user.id, revokedAt: null } });
    res.status(204).end();
  }));
  router.get('/me', authenticate, asyncHandler(async (req, res) => {
    res.json({ id: req.user.id, name: req.user.name, role: req.user.role.name, permissions: [...req.permissions] });
  }));
  return router;
}

function awaitImportExpress() {
  throw new Error('Express router factory must receive express.Router from app.js');
}
