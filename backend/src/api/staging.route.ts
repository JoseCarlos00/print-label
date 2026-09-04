import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { approve, listStaging, reject } from '../controllers/staging.controller.js';

const router = Router();

/* /api/staging */
router.get('/', requireAdmin, listStaging);

router.post('/:id/approve', requireAdmin, approve);
router.post('/:id/reject', requireAdmin, reject);

export default router;
