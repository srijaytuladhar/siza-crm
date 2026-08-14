import express from 'express';
import { ItemController } from '../controllers/ItemController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { itemValidators, paginationValidators } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', paginationValidators.list, ItemController.list);
router.get('/:id', itemValidators.update, ItemController.get);
router.post('/', itemValidators.create, ItemController.create);
router.put('/:id', itemValidators.update, ItemController.update);
router.delete('/:id', itemValidators.update, ItemController.delete);

router.put('/:id/status', authorize('super_admin', 'admin'), itemValidators.updateStatus, ItemController.updateStatus);

export default router;