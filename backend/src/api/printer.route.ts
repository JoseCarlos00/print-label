import { Router } from 'express';
import { listPrinters, getPrinterById } from '../controllers/printer.controller.js';

const router = Router();

/* /api/printers */
router.get('/', listPrinters);
router.get('/:id', getPrinterById);

export default router;
