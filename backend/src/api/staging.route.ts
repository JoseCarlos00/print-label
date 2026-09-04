import { Router } from 'express';
import { attachAdminStatus } from '../middleware/auth.middleware.js';

const router = Router();

/* /api/staging */
router.get('/', attachAdminStatus, ()=> {});

router.post('/:id/approve', attachAdminStatus, () => {});
router.post('//:id/reject', attachAdminStatus, () => {});

export default router;
