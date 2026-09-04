import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

/* /api/staging */
router.get('/', requireAdmin, () => {});

router.post('/:id/approve', requireAdmin, () => {});
router.post('//:id/reject', requireAdmin, () => {});

export default router;
