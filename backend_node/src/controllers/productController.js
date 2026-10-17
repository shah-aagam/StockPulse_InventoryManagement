import { Product } from '../models/index.js';
import { getProduct, signal } from '../services/stockPulseService.js';

const categories = ['ELECTRONICS', 'APPAREL', 'HOME'];

async function listProducts(req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  res.json(await Product.find(filter).sort({ _id: 1 }));
}

async function createProduct(req, res) {
  const { id, sku, name, category, currentPrice, stockLevel, reorderThreshold, demandVelocity } = req.body || {};
  if (![id, sku, name, category].every((value) => typeof value === 'string' && value.trim()) || !categories.includes(category)) {
    return res.status(400).json({ error: 'id, sku, name and a valid category are required' });
  }
  if (!Number.isFinite(Number(currentPrice)) || Number(currentPrice) <= 0 || ![stockLevel, reorderThreshold, demandVelocity].every((value) => Number.isInteger(value) && value >= 0)) {
    return res.status(400).json({ error: 'Price must be positive and stock, threshold, and demand velocity must be non-negative integers' });
  }
  const product = await Product.create({ _id: id, sku, name, category, currentPrice, stockLevel, reorderThreshold, demandVelocity, status: stockLevel === 0 ? 'OUT_OF_STOCK' : 'ACTIVE' });
  res.status(201).json(product);
}

async function updateStock(req, res) {
  const { stockLevel } = req.body || {};
  if (!Number.isInteger(stockLevel) || stockLevel < 0) return res.status(400).json({ error: 'stockLevel must be a non-negative integer' });
  const product = await getProduct(req.params.id);
  product.stockLevel = stockLevel;
  if (stockLevel === 0) product.status = 'OUT_OF_STOCK';
  else if (product.status === 'OUT_OF_STOCK') product.status = 'ACTIVE';
  await product.save();
  await signal(product);
  res.json(product);
}

async function recordOrder(req, res) {
  const { quantity } = req.body || {};
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'quantity must be a positive integer' });
  const product = await getProduct(req.params.id);
  if (quantity > product.stockLevel) return res.status(400).json({ error: 'Order quantity exceeds available stock' });
  product.stockLevel -= quantity;
  product.demandVelocity += quantity;
  if (product.stockLevel === 0) product.status = 'OUT_OF_STOCK';
  await product.save();
  await signal(product);
  res.json(product);
}

export { listProducts, createProduct, updateStock, recordOrder };
