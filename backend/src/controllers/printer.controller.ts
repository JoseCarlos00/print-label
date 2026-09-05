import type { Request, Response } from 'express';
import { listPrinterProfiles, getPrinterProfileById } from '../printerProfileRepo.js';

export const listPrinters = (_req: Request, res: Response) => {
	res.json(listPrinterProfiles());
};

export const getPrinterById = (req: Request, res: Response) => {
	const { id } = req.params;

	if (typeof id !== 'string' || id.length === 0) {
		return res.status(400).json({ message: 'Falta el id de la Impresora' });
	}

	const printer = getPrinterProfileById(id);

	if (!printer) {
		return res.status(404).json({ message: `No existe impresora con id: ${id}` });
	}

	res.json(printer);
};
