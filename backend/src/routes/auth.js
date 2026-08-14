import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';
import { authValidators } from '../middleware/validation.js';

const router = express.Router();

router.post('/login', authValidators.login, AuthController.login);
router.post('/register', authenticate, authValidators.register, AuthController.register);
router.get('/me', authenticate, AuthController.me);
router.post('/refresh', authenticate, AuthController.refresh);

export default router;