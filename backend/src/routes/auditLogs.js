import express from 'express';
import { AuditLogModel } from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { paginationValidators } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('super_admin', 'admin'));

router.get('/', paginationValidators.list, async (req, res) => {
  try {
    const { userId, entityType, entityId, action, startDate, endDate, page, limit } = req.query;
    const result = await AuditLogModel.findAll({
      userId: userId ? parseInt(userId) : undefined,
      entityType,
      entityId: entityId ? parseInt(entityId) : undefined,
      action,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json(result);
  } catch (err) {
    console.error('Audit log list error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const history = await AuditLogModel.getEntityHistory(entityType, parseInt(entityId));
    res.json(history);
  } catch (err) {
    console.error('Audit log entity history error:', err);
    res.status(500).json({ error: 'Failed to fetch entity history' });
  }
});

export default router;