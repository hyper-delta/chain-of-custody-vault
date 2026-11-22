import 'dotenv/config';
import { createApp } from './app.js';
import { sequelize } from './db/sequelize.js';
import { connectMongo } from './db/mongo.js';
import { logger } from './lib/logger.js';

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  await connectMongo();
  const app = createApp();
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => logger.info({ port }, 'API listening'));
}

start().catch((error) => { logger.fatal({ err: error }, 'Server failed to start'); process.exit(1); });
