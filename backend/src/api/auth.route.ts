import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller.js';
import { attachAdminStatus } from '../middleware/auth.middleware.js';

const router = Router();

/* /api/auth */
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', attachAdminStatus, me);

export default router;
