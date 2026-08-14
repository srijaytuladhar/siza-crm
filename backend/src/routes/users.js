import express from 'express';
import { UserController } from '../controllers/UserController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { userValidators, paginationValidators } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('super_admin', 'admin'));

router.get('/', paginationValidators.list, UserController.list);
router.get('/roles', UserController.getRoles);
router.get('/:id', userValidators.update, UserController.get);
router.post('/', userValidators.create, UserController.create);
router.put('/:id', userValidators.update, UserController.update);
router.put('/:id/password', userValidators.updatePassword, UserController.updatePassword);
router.delete('/:id', userValidators.update, UserController.delete);

export default router;