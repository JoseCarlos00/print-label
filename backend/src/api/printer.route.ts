import { Router } from 'express';
import { listPrinters } from '../controllers/printer.controller.js';

const router = Router();

/* /api/printers */
router.get('/', listPrinters);

export default router;
