import type { Request, Response } from 'express';
import type { CreateTemplateInput } from 'shared';
import {
	createTemplate,
	getById,
	listAllApproved,
	listApprovedPublics,
} from '../templateRepo.js';

function isValidInput(body: unknown): body is CreateTemplateInput {
	if (!body || typeof body !== 'object') return false;

	const input = body as Partial<CreateTemplateInput>;

	return (
		typeof input.name === 'string' &&
		input.name.trim().length > 0 &&
		typeof input.profileId === 'string' &&
		input.profileId.trim().length > 0 &&
		Array.isArray(input.elements) &&
		input.elements.length > 0 &&
		typeof input.public === 'boolean'
	);
}

// POST /api/templates (admin) — se crea directo como approved
export const createApproved = (req: Request, res: Response) => {
	if (!isValidInput(req.body)) {
		return res.status(400).json({ message: 'Datos de plantilla inválidos o incompletos' });
	}

	try {
		const template = createTemplate(req.body, 'approved');
		console.info(`Plantilla creada directamente (admin): ${template.id} - ${template.name}`);

		res.status(201).json(template);
	} catch (error) {
		console.error(`Error creando plantilla: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

// POST /api/templates/staging (público) — queda pendiente de revisión
export const createStaging = (req: Request, res: Response) => {
	if (!isValidInput(req.body)) {
		return res.status(400).json({ message: 'Datos de plantilla inválidos o incompletos' });
	}

	try {
		const template = createTemplate(req.body, 'pending');
		console.info(`Plantilla enviada a revisión: ${template.id} - ${template.name}`);

		res.status(201).json(template);
	} catch (error) {
		console.error(`Error creando plantilla en staging: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

// GET /api/templates (público) — solo approved + public
export const listPublic = (_req: Request, res: Response) => {
	res.json(listApprovedPublics());
};

// GET /api/templates/todas (admin) — todas las approved, públicas o no
export const listAll = (_req: Request, res: Response) => {
	res.json(listAllApproved());
};

// GET /api/templates/:id
export const getOne = (req: Request, res: Response) => {
	const { id } = req.params;

	if (typeof id !== 'string' || id.length === 0) {
		return res.status(400).json({ message: 'Falta el id de la plantilla' });
	}


	const template = getById(id);

	if (!template) {
		return res.status(404).json({ message: 'Plantilla no encontrada' });
	}

	const isVisibleToPublic = template.state === 'approved' && template.public;
  
	if (!isVisibleToPublic && !req.isAdmin) {
		return res.status(404).json({ message: 'Plantilla no encontrada' });
	}

	res.json(template);
};
