import mongoose from 'mongoose';

const strategySchema = new mongoose.Schema({
  _id: { type: String, default: 'active' },
  active: { type: String, enum: ['rule', 'ai'], default: 'rule' },
}, { versionKey: false });

const Strategy = mongoose.model('Strategy', strategySchema);
export default Strategy;
