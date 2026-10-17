import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as controller from '../controllers/productController.js';
const router = Router();

router.get('/', asyncHandler(controller.listProducts));
router.post('/', asyncHandler(controller.createProduct));
router.patch('/:id/stock', asyncHandler(controller.updateStock));
router.post('/:id/orders', asyncHandler(controller.recordOrder));
export default router;
