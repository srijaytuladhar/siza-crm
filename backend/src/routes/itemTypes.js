import express from 'express';
import { ItemTypeController } from '../controllers/ItemTypeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';
import { validate } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

const itemTypeValidators = {
  create: [
    body('itemId').isInt({ min: 1 }).withMessage('Valid item ID required'),
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name required (1-100 chars)'),
    validate,
  ],
  id: [param('id').isInt({ min: 1 }).withMessage('Valid ID required'), validate],
  itemId: [param('itemId').isInt({ min: 1 }).withMessage('Valid item ID required'), validate],
};

router.get('/', ItemTypeController.list);
router.get('/item/:itemId', itemTypeValidators.itemId, ItemTypeController.listByItem);
router.post('/', authorize('super_admin', 'admin'), itemTypeValidators.create, ItemTypeController.create);
router.delete('/:id', authorize('super_admin', 'admin'), itemTypeValidators.id, ItemTypeController.delete);

export default router;