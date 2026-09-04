import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

/* /api/templates */
router.get('/', ()=> {});
router.get('/all', requireAdmin, () => {});
router.get('/:id', ()=> {});

router.post('/staging', () =>  {});
router.post('/', ()=> {});

export default router;
