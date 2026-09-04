import type { Request, Response } from 'express';
import type { LabelElement } from 'shared';
import { generateZpl } from 'shared/zpl';
import { getPrinterProfileById } from '../printerProfileRepo.js';
import { sendToPrinter } from '../services/printerService.js';

interface PrintRequestBody {
	elements: LabelElement[];
	profileId: string;
}

function isValidBody(body: unknown): body is PrintRequestBody {
	if (!body || typeof body !== 'object') return false;
	const input = body as Partial<PrintRequestBody>;
  
	return (
		Array.isArray(input.elements) &&
		input.elements.length > 0 &&
		typeof input.profileId === 'string' &&
		input.profileId.trim().length > 0
	);
}

// POST /api/print (público/admin)
export const print = async (req: Request, res: Response) => {
	if (!isValidBody(req.body)) {
		return res.status(400).json({ message: 'Datos de impresión inválidos o incompletos' });
	}

	const profile = getPrinterProfileById(req.body.profileId);

	if (!profile) {
		return res.status(404).json({ message: 'Perfil de impresora no encontrado' });
	}

	try {
		const zpl = generateZpl(req.body.elements, profile);
		await sendToPrinter(profile.ip, zpl);

		console.info(`Etiqueta enviada a impresora ${profile.name} (${profile.ip})`);
		res.status(200).json({ message: 'Etiqueta enviada a la impresora' });
	} catch (error) {
		console.error(`Error enviando ZPL a ${profile.ip}: ${error}`);
    
		res.status(502).json({
			message: `No se pudo conectar con la impresora "${profile.name}" (${profile.ip}). Verifica que esté encendida y en red.`,
		});
	}
};
