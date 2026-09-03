// backend/src/api/printer.route.ts
import { Router } from 'express';
import { listPrinters } from '../controllers/printer.controller.js';

const router = Router();
router.get('/', listPrinters);

export default router;
