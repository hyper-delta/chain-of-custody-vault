import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'node:fs';
import pinoHttp from 'pino-http';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './lib/logger.js';
import { authRoutes } from './modules/auth/routes.js';
import { itemRoutes } from './modules/items/routes.js';
import { auditRoutes } from './modules/audit/routes.js';
import { validate } from './middleware/validate.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean);
  app.use(cors({ origin: origins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'] }));
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => req.requestId }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use('/api/v1/auth', authRoutes(validate));
  app.use('/api/v1', itemRoutes(validate));
  app.use('/api/v1/audit', auditRoutes);
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', service: 'chain-of-custody-vault' }));

  try {
    const spec = YAML.parse(fs.readFileSync(new URL('../docs/openapi.yaml', import.meta.url), 'utf8'));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  } catch (error) {
    logger.warn({ err: error }, 'OpenAPI documentation unavailable');
  }
  app.use(errorHandler);
  return app;
}
