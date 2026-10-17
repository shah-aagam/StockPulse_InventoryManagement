import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as controller from '../controllers/suggestionController.js';
const router = Router();

router.get('/pricing-suggestions', asyncHandler(controller.listPricingSuggestions));
router.get('/reorder-suggestions', asyncHandler(controller.listReorderSuggestions));
router.patch('/pricing-suggestions/:id', asyncHandler(controller.decidePricing));
router.patch('/reorder-suggestions/:id', asyncHandler(controller.decideReorder));
router.post('/products/:id/suggest-pricing', asyncHandler(controller.suggestPricing));
router.post('/products/:id/suggest-reorder', asyncHandler(controller.suggestReorder));
export default router;
