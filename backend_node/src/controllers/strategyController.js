import { Strategy } from '../models/index.js';
import { currentStrategy } from '../services/stockPulseService.js';

async function getStrategy(_req, res) {
  res.json({ active: await currentStrategy() });
}
async function setStrategy(req, res) {
  if (!['rule', 'ai'].includes(req.body?.active)) return res.status(400).json({ error: 'Strategy must be one of: rule, ai' });
  await Strategy.findByIdAndUpdate('active', { active: req.body.active }, { upsert: true, new: true, setDefaultsOnInsert: true });
  res.json({ active: req.body.active });
}

export { getStrategy, setStrategy };
