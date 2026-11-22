import jwt from 'jsonwebtoken';
import { User, Role, Permission } from '../db/models/index.js';
import { AppError } from '../lib/errors.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('UNAUTHORIZED', 401, 'Authentication required.');
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED';
      throw new AppError(code, 401, code === 'TOKEN_EXPIRED' ? 'Access token expired.' : 'Invalid access token.');
    }
    const user = await User.findByPk(payload.sub, { include: [{ model: Role, as: 'role', include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }] }] });
    if (!user || !user.isActive) throw new AppError('UNAUTHORIZED', 401, 'User is inactive or unavailable.');
    req.user = user;
    req.permissions = new Set(user.role.permissions.map((permission) => permission.code));
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(code) {
  return (req, _res, next) => {
    if (!req.user || !req.permissions?.has(code)) {
      return next(new AppError('FORBIDDEN', 403, 'Insufficient permission.'));
    }
    next();
  };
}
