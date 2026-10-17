import mongoose from 'mongoose';

const reorderSuggestionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  product: { type: String, ref: 'Product', required: true },
  currentStock: { type: Number, required: true },
  recommendedQuantity: { type: Number, required: true, min: 1 },
  suggestedLeadTimeDays: { type: Number, required: true, min: 1 },
  confidence: { type: Number, min: 0, max: 1, required: true },
  reasoning: { type: String, required: true, maxlength: 1600 },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING', required: true },
  triggerReason: { type: String, enum: ['INITIAL', 'INVENTORY_LOW', 'DEMAND_SPIKE', 'MANUAL'], required: true },
}, { timestamps: true, versionKey: false, toJSON: { transform: (_doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.createdAt; delete ret.updatedAt; return ret; } } });

const ReorderSuggestion = mongoose.model('ReorderSuggestion', reorderSuggestionSchema);
export default ReorderSuggestion;
