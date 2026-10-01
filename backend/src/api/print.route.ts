import { Router } from 'express';
import { print } from '../controllers/print.controller.js';
import { limitPrintRequests } from '../middleware/rateLimit.middleware.js';

const router = Router();

/* /api/print */
router.post('/', limitPrintRequests, print);

export default router;
