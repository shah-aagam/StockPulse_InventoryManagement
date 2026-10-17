import { randomUUID } from 'node:crypto';
import { Product, PricingSuggestion, ReorderSuggestion, Strategy } from '../models/index.js';
import { enqueueRecommendation } from './recommendationQueue.js';
import { recommend } from './commerceAdvisor.js';

const averageDemand = async (category) => {
  const result = await Product.aggregate([{ $match: { category } }, { $group: { _id: null, average: { $avg: '$demandVelocity' } } }]);
  return result[0]?.average ?? 1;
};
const getProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) { const error = new Error(`Product not found: ${id}`); error.status = 404; throw error; }
  return product;
};
const serializeSuggestion = async (suggestion) => {
  const result = suggestion.toJSON();
  result.product = await Product.findById(suggestion.product);
  return result;
};
const currentStrategy = async () => (await Strategy.findById('active'))?.active || 'rule';

async function createManualSuggestion(productId, triggerReason, type) {
  const Model = type === 'pricing' ? PricingSuggestion : ReorderSuggestion;
  const existing = await Model.exists({ product: productId, triggerReason, status: 'PENDING' });
  if (existing) { const error = new Error(`A pending ${type} suggestion already exists for this product and trigger`); error.status = 409; throw error; }
  const product = await getProduct(productId);
  const [avg, strategy] = await Promise.all([averageDemand(product.category), currentStrategy()]);
  const result = await recommend(product, avg, triggerReason, strategy);
  const suggestion = type === 'pricing'
    ? await PricingSuggestion.create({ _id: randomUUID(), product: productId, currentPrice: product.currentPrice, recommendedPrice: result.recommendedPrice, direction: result.direction, confidence: result.pricingConfidence, reasoning: result.pricingReasoning, triggerReason })
    : await ReorderSuggestion.create({ _id: randomUUID(), product: productId, currentStock: product.stockLevel, recommendedQuantity: result.recommendedQuantity, suggestedLeadTimeDays: 7, confidence: result.reorderConfidence, reasoning: result.reorderReasoning, triggerReason });
  if (product.stockLevel > 0) { product.status = 'PRICE_REVIEW_PENDING'; await product.save(); }
  return serializeSuggestion(suggestion);
}

async function decide(type, id, decision) {
  if (!['ACCEPTED', 'REJECTED'].includes(decision)) { const error = new Error('Decision must be ACCEPTED or REJECTED'); error.status = 400; throw error; }
  const Model = type === 'pricing' ? PricingSuggestion : ReorderSuggestion;
  const suggestion = await Model.findById(id);
  if (!suggestion) { const error = new Error(`${type === 'pricing' ? 'Pricing' : 'Reorder'} suggestion not found: ${id}`); error.status = 404; throw error; }
  if (suggestion.status !== 'PENDING') { const error = new Error('Only PENDING suggestions can be decided'); error.status = 409; throw error; }
  const product = await getProduct(suggestion.product);
  suggestion.status = decision;
  if (decision === 'ACCEPTED') {
    if (type === 'pricing') product.currentPrice = suggestion.recommendedPrice;
    else product.stockLevel += suggestion.recommendedQuantity;
  }
  await Promise.all([suggestion.save(), product.save()]);
  if (product.stockLevel === 0) product.status = 'OUT_OF_STOCK';
  else {
    const pendingPricing = await PricingSuggestion.exists({ product: product._id, status: 'PENDING' });
    product.status = pendingPricing ? 'PRICE_REVIEW_PENDING' : 'ACTIVE';
  }
  await product.save();
  return serializeSuggestion(suggestion);
}

async function signal(product) {
  if (product.stockLevel < product.reorderThreshold) await enqueueRecommendation(product.id, 'INVENTORY_LOW');
  const avg = await averageDemand(product.category);
  if (product.demandVelocity > avg * 3) await enqueueRecommendation(product.id, 'DEMAND_SPIKE');
}

export { averageDemand, getProduct, serializeSuggestion, currentStrategy, createManualSuggestion, decide, signal };
