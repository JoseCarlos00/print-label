import type { Request, Response } from 'express';
import { approveTemplate, listPending, rejectTemplate } from '../templateRepo.js';

// GET /api/staging (admin)
export const listStaging = (_req: Request, res: Response) => {
	res.json(listPending());
};

// POST /api/staging/:id/aprobar (admin)
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

// POST /api/staging/:id/rechazar (admin)
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

