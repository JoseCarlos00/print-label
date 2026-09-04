import type { Request, Response } from 'express';
import { getById, listPending, updateState } from '../templateRepo.js';

// GET /api/staging (admin)
export const listStaging = (_req: Request, res: Response) => {
	res.json(listPending());
};

// POST /api/staging/:id/aprobar (admin)
export const approve = (req: Request, res: Response) => {
	const { id } = req.params;

	if (typeof id !== 'string' || id.length === 0) {
		return res.status(400).json({ message: 'Falta el id de la plantilla' });
	}


	const existing = getById(id);

	if (!existing) {
		return res.status(404).json({ message: 'Plantilla no encontrada' });
	}

	if (existing.state !== 'pending') {
		return res.status(409).json({ message: 'La plantilla no está pendiente de revisión' });
	}

	const template = updateState(id, 'approved');
	console.info(`Plantilla aprobada: ${id}`);

	res.json(template);
};

// POST /api/staging/:id/rechazar (admin)
export const reject = (req: Request, res: Response) => {
	const { id } = req.params;

	if (typeof id !== 'string' || id.length === 0) {
		return res.status(400).json({ message: 'Falta el id de la plantilla' });
	}


	const existing = getById(id);

	if (!existing) {
		return res.status(404).json({ message: 'Plantilla no encontrada' });
	}
	
	if (existing.state !== 'pending') {
		return res.status(409).json({ message: 'La plantilla no está pendiente de revisión' });
	}

	const template = updateState(id, 'rejected');
	console.info(`Plantilla rechazada: ${id}`);
	
	res.json(template);
};
