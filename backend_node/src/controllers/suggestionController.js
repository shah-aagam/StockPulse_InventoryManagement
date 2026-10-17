import { PricingSuggestion, ReorderSuggestion } from '../models/index.js';
import { serializeSuggestion, createManualSuggestion, decide } from '../services/stockPulseService.js';

async function listPricingSuggestions(_req, res) {
  const list = await PricingSuggestion.find({ status: 'PENDING' }).sort({ _id: -1 });
  res.json(await Promise.all(list.map(serializeSuggestion)));
}
async function listReorderSuggestions(_req, res) {
  const list = await ReorderSuggestion.find({ status: 'PENDING' }).sort({ _id: -1 });
  res.json(await Promise.all(list.map(serializeSuggestion)));
}
async function suggestPricing(req, res) {
  res.json(await createManualSuggestion(req.params.id, 'MANUAL', 'pricing'));
}
async function suggestReorder(req, res) {
  res.json(await createManualSuggestion(req.params.id, 'MANUAL', 'reorder'));
}
async function decidePricing(req, res) {
  res.json(await decide('pricing', req.params.id, req.body?.status));
}
async function decideReorder(req, res) {
  res.json(await decide('reorder', req.params.id, req.body?.status));
}

export { listPricingSuggestions, listReorderSuggestions, suggestPricing, suggestReorder, decidePricing, decideReorder };
