import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['ELECTRONICS', 'APPAREL', 'HOME'] },
  currentPrice: { type: Number, required: true, min: 0.01 },
  stockLevel: { type: Number, required: true, min: 0, validate: Number.isInteger },
  reorderThreshold: { type: Number, required: true, min: 0, validate: Number.isInteger },
  demandVelocity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  status: { type: String, required: true, enum: ['ACTIVE', 'PRICE_REVIEW_PENDING', 'OUT_OF_STOCK'] },
}, { timestamps: true, versionKey: false, toJSON: { transform: (_doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.createdAt; delete ret.updatedAt; return ret; } } });

const Product = mongoose.model('Product', productSchema);
export default Product;
