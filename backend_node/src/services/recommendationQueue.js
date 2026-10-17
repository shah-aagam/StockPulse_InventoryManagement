import amqp from 'amqplib';
import config from '../config/index.js';
const { rabbitUrl } = config;

let connection;
let channel;
async function getChannel() {
  if (channel) return channel;
  connection = await amqp.connect(rabbitUrl);
  connection.on('close', () => { connection = undefined; channel = undefined; });
  channel = await connection.createConfirmChannel();
  await channel.assertQueue('stockpulse.pricing', { durable: true });
  await channel.assertQueue('stockpulse.reorder', { durable: true });
  return channel;
}
async function enqueueRecommendation(productId, triggerReason) {
  const ch = await getChannel();
  const payload = Buffer.from(JSON.stringify({ productId, triggerReason }));
  const options = { persistent: true, contentType: 'application/json' };
  ch.sendToQueue('stockpulse.pricing', payload, options);
  ch.sendToQueue('stockpulse.reorder', payload, options);
  await ch.waitForConfirms();
}
async function closeQueue() {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
export { getChannel, enqueueRecommendation, closeQueue };
