import { Router } from 'express';
import { print } from '../controllers/print.controller.js';

const router = Router();

/* /api/print */
router.post('/', print);

export default router;
