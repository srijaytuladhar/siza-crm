import express from 'express';
import { BillController } from '../controllers/BillController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { billValidators, paginationValidators } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', paginationValidators.list, BillController.list);
router.get('/summary', BillController.getSummary);
router.get('/project-summary', authorize('super_admin', 'admin'), BillController.getProjectSummary);
router.get('/:id', billValidators.update, BillController.get);
router.post('/', billValidators.create, BillController.create);
router.put('/:id', billValidators.update, BillController.update);
router.delete('/:id', billValidators.update, BillController.delete);

export default router;