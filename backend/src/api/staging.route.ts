import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import {
	approve,
	listRejectedStaging,
	listStaging,
	pendingCount,
	reject,
	removeRejected,
	restore,
} from '../controllers/staging.controller.js';

const router = Router();

/* /api/staging */
router.get('/', requireAdmin, listStaging);
router.get('/count', requireAdmin, pendingCount);
router.get('/rejected', requireAdmin, listRejectedStaging);

router.post('/:id/approve', requireAdmin, approve);
router.post('/:id/reject', requireAdmin, reject);
router.post('/:id/restore', requireAdmin, restore);
router.delete('/:id', requireAdmin, removeRejected);

export default router;
