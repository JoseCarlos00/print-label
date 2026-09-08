import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import {
	createApproved,
	createStaging,
	getOne,
	listAll,
	listPublic,
	update,
} from '../controllers/template.controller.js';


const router = Router();

/* /api/templates */
router.get('/all', requireAdmin, listAll);

router.post('/staging', createStaging);
router.post('/', requireAdmin, createApproved);


router.get('/', listPublic);
router.get('/:id', getOne);

router.put('/:id', update);

export default router;
