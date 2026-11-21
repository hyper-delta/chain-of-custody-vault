import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.validated = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        next(new AppError('VALIDATION_ERROR', 422, 'Validation failed.', details));
      } else {
        next(error);
      }
    }
  };
}
