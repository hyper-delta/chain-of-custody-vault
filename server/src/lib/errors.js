export class AppError extends Error {
  constructor(code, status, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const errors = {
  unauthorized: (message = 'Authentication required.') =>
    new AppError('UNAUTHORIZED', 401, message),
  tokenExpired: () =>
    new AppError('TOKEN_EXPIRED', 401, 'Access token expired.'),
  forbidden: (code = 'FORBIDDEN', message = 'Insufficient permission.') =>
    new AppError(code, 403, message),
  notFound: (message = 'Resource not found.') =>
    new AppError('NOT_FOUND', 404, message),
  stale: () =>
    new AppError('STALE_ITEM', 409, 'Item changed since you loaded it. Reload and retry.'),
  conflict: (code, message, details = null) =>
    new AppError(code, 409, message, details),
  validation: (details) =>
    new AppError('VALIDATION_ERROR', 422, 'Validation failed.', details),
};
