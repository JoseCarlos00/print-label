import { Router } from 'express';
import { attachAdminStatus } from '../middleware/auth.middleware.js';

const router = Router();

/* /api/templates */
router.get('/', ()=> {});
router.get('/all', attachAdminStatus, ()=> {});
router.get('/:id', ()=> {});

router.post('/staging', () =>  {});
router.post('/', ()=> {});

export default router;
