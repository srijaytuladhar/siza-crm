import express from 'express';
import { ProjectController } from '../controllers/ProjectController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { projectValidators, paginationValidators } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', paginationValidators.list, ProjectController.list);
router.get('/:id', projectValidators.update, ProjectController.get);

router.post('/', authorize('super_admin', 'admin'), projectValidators.create, ProjectController.create);
router.put('/:id', authorize('super_admin', 'admin'), projectValidators.update, ProjectController.update);
router.delete('/:id', authorize('super_admin', 'admin'), projectValidators.update, ProjectController.delete);

router.post('/:id/users', authorize('super_admin', 'admin'), projectValidators.assignUser, ProjectController.assignUser);
router.delete('/:id/users/:userId', authorize('super_admin', 'admin'), projectValidators.assignUser, ProjectController.removeUser);

export default router;