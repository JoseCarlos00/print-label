// backend/src/controllers/printer.controller.ts
import type { Request, Response } from 'express';
import { listPrinterProfiles } from '../printerProfileRepo.js';

export const listPrinters = (_req: Request, res: Response) => {
	res.json(listPrinterProfiles());
};
