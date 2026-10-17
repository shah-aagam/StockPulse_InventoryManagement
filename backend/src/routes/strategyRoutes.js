import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as controller from '../controllers/strategyController.js';
const router = Router();

router.get('/', asyncHandler(controller.getStrategy));
router.put('/', asyncHandler(controller.setStrategy));
export default router;
