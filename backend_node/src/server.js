import mongoose from 'mongoose';
import app from './app.js';
import config from './config/index.js';
import { Strategy } from './models/index.js';
import seed from './utils/seedDemoData.js';
import { closeQueue } from './services/recommendationQueue.js';

async function start() {
  await mongoose.connect(config.mongoUri);
  await seed(config.seedDemoData);
  await Strategy.updateOne({ _id: 'active' }, { $setOnInsert: { active: 'rule' } }, { upsert: true });
  app.listen(config.port, () => console.log(`StockPulse Node API listening on http://localhost:${config.port}`));
}
start().catch((error) => { console.error('Unable to start StockPulse API:', error.message); process.exit(1); });

async function shutdown() {
  await closeQueue().catch(() => {});
  await mongoose.disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
