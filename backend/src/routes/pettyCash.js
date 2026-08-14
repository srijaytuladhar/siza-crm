import express from 'express';
import { PettyCashController } from '../controllers/PettyCashController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { pettyCashValidators, paginationValidators } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/allocations', paginationValidators.list, PettyCashController.getAllocations);
router.get('/expenses', paginationValidators.list, PettyCashController.getExpenses);
router.get('/balance', PettyCashController.getBalance);

router.post('/allocate', authorize('super_admin', 'admin'), pettyCashValidators.allocate, PettyCashController.allocate);
router.post('/expense', pettyCashValidators.expense, PettyCashController.addExpense);

router.delete('/allocations/:id', authorize('super_admin', 'admin'), pettyCashValidators.allocate, PettyCashController.deleteAllocation);
router.delete('/expenses/:id', authorize('super_admin', 'admin'), pettyCashValidators.expense, PettyCashController.deleteExpense);

export default router;