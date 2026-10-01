import type { Request, Response } from 'express';
import {
	approveTemplate,
	countPending,
	deleteRejectedTemplate,
	listPending,
	listRejected,
	rejectTemplate,
	restoreRejectedTemplate,
} from '../templateRepo.js';

// GET /api/staging (admin)
export const listStaging = (_req: Request, res: Response) => {
	res.json(listPending());
};

// GET /api/staging/rejected (admin)
export const listRejectedStaging = (_req: Request, res: Response) => {
	res.json(listRejected());
};

// POST /api/staging/:id/approve (admin)
export const approve = (req: Request, res: Response) => {
	const { id } = req.params;

	if (typeof id !== 'string' || id.length === 0) {
		return res.status(400).json({
			message: 'Falta el id de la plantilla',
		});
	}

	try {
		const template = approveTemplate(id);

		if (!template) {
			return res.status(404).json({
				message: 'Plantilla pendiente no encontrada',
			});
		}

		console.info(`Plantilla aprobada: ${template.id} - ${template.name}`);

		return res.json(template);
	} catch (error) {
		console.error(`Error aprobando plantilla: ${error}`);

		return res.status(500).json({
			message: 'Error interno del servidor',
		});
	}
};

// POST /api/staging/:id/reject (admin)
export const reject = (req: Request, res: Response) => {
	const { id } = req.params;

	if (typeof id !== 'string' || id.length === 0) {
		return res.status(400).json({
			message: 'Falta el id de la plantilla',
		});
	}

	try {
		const template = rejectTemplate(id);

		if (!template) {
			return res.status(404).json({
				message: 'Plantilla pendiente no encontrada',
			});
		}

		console.info(`Plantilla rechazada: ${template.id} - ${template.name}`);

		return res.json(template);
	} catch (error) {
		console.error(`Error rechazando plantilla: ${error}`);

		return res.status(500).json({
			message: 'Error interno del servidor',
		});
	}
};

// POST /api/staging/:id/restore (admin)
export const restore = (req: Request, res: Response) => {
	const { id } = req.params;

	if (typeof id !== 'string' || id.length === 0) {
		return res.status(400).json({ message: 'Falta el id de la plantilla' });
	}

	try {
		const template = restoreRejectedTemplate(id);

		if (!template) {
			return res.status(404).json({ message: 'Plantilla rechazada no encontrada' });
		}

		console.info(`Plantilla restaurada a pendientes: ${template.id} - ${template.name}`);
		return res.json(template);
	} catch (error) {
		console.error(`Error restaurando plantilla: ${error}`);
		return res.status(500).json({ message: 'Error interno del servidor' });
	}
};

// DELETE /api/staging/:id (admin) — solo permite eliminar rechazadas
export const removeRejected = (req: Request, res: Response) => {
	const { id } = req.params;

	if (typeof id !== 'string' || id.length === 0) {
		return res.status(400).json({ message: 'Falta el id de la plantilla' });
	}

	try {
		if (!deleteRejectedTemplate(id)) {
			return res.status(404).json({ message: 'Plantilla rechazada no encontrada' });
		}

		console.info(`Plantilla rechazada eliminada definitivamente: ${id}`);
		return res.status(204).send();
	} catch (error) {
		console.error(`Error eliminando plantilla rechazada: ${error}`);
		return res.status(500).json({ message: 'Error interno del servidor' });
	}
};

// GET /api/staging/count (admin)
export const pendingCount = (_req: Request, res: Response) => {
	res.json({ count: countPending() });
};
