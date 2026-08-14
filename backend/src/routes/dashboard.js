import express from 'express';
import { DashboardController } from '../controllers/DashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', authorize('super_admin', 'admin'), DashboardController.getStats);
router.get('/user', DashboardController.getUserDashboard);

export default router;