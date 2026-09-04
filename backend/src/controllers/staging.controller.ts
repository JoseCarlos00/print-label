import type { Request, Response } from 'express';
import { getById, listPending, updateState } from '../templateRepo.js';

// GET /api/staging (admin)
export const listStaging = (_req: Request, res: Response) => {
	res.json(listPending());
};

// POST /api/staging/:id/aprobar (admin)
export const approve = (req: Request, res: Response) => {
	const existing = getById(req.params.id?.toString() ?? '');

	if (!existing) {
		return res.status(404).json({ message: 'Plantilla no encontrada' });
	}

	if (existing.state !== 'pending') {
		return res.status(409).json({ message: 'La plantilla no está pendiente de revisión' });
	}

	const template = updateState(req.params.id?.toString() ?? '', 'approved');
	console.info(`Plantilla aprobada: ${req.params.id}`);

	res.json(template);
};

// POST /api/staging/:id/rechazar (admin)
export const reject = (req: Request, res: Response) => {
	const existing = getById(req.params.id?.toString() ?? '');

	if (!existing) {
		return res.status(404).json({ message: 'Plantilla no encontrada' });
	}
	
	if (existing.state !== 'pending') {
		return res.status(409).json({ message: 'La plantilla no está pendiente de revisión' });
	}

	const template = updateState(req.params.id?.toString() ?? '', 'rejected');
	console.info(`Plantilla rechazada: ${req.params.id}`);
	res.json(template);
};
