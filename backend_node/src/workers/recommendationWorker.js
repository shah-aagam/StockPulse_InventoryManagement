import mongoose from 'mongoose';
import config from '../config/index.js';
import { getChannel } from '../services/recommendationQueue.js';
import { createManualSuggestion } from '../services/stockPulseService.js';

async function consume(channel, queueName, kind) {
  await channel.assertQueue(queueName, { durable: true });
  channel.prefetch(1);
  await channel.consume(queueName, async (message) => {
    if (!message) return;
    try {
      const { productId, triggerReason } = JSON.parse(message.content.toString());
      await createManualSuggestion(productId, triggerReason, kind);
      channel.ack(message);
    } catch (error) {
      console.error(`${queueName} job failed:`, error.message);
      // Invalid payloads are discarded; transient database failures are requeued.
      channel.nack(message, false, error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError');
    }
  });
}

async function start() {
  await mongoose.connect(config.mongoUri);
  const channel = await getChannel();
  await Promise.all([consume(channel, 'stockpulse.pricing', 'pricing'), consume(channel, 'stockpulse.reorder', 'reorder')]);
  console.log('StockPulse pricing and reorder workers are consuming RabbitMQ queues');
}
start().catch((error) => { console.error('Unable to start worker:', error.message); process.exit(1); });
process.on('SIGINT', async () => { await mongoose.disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await mongoose.disconnect(); process.exit(0); });
