import mongoose from 'mongoose';

const pricingSuggestionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  product: { type: String, ref: 'Product', required: true },
  currentPrice: { type: Number, required: true },
  recommendedPrice: { type: Number, required: true, min: 0.01 },
  direction: { type: String, enum: ['INCREASE', 'DECREASE', 'HOLD'], required: true },
  confidence: { type: Number, min: 0, max: 1, required: true },
  reasoning: { type: String, required: true, maxlength: 1600 },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING', required: true },
  triggerReason: { type: String, enum: ['INITIAL', 'INVENTORY_LOW', 'DEMAND_SPIKE', 'MANUAL'], required: true },
}, { timestamps: true, versionKey: false, toJSON: { transform: (_doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.createdAt; delete ret.updatedAt; return ret; } } });

const PricingSuggestion = mongoose.model('PricingSuggestion', pricingSuggestionSchema);
export default PricingSuggestion;
