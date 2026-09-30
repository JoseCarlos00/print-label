import { MAX_IMAGE_DIMENSION } from 'shared/zpl';

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'] as const;

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface ImportedImage {
	src: string;
	widthPx: number;
	heightPx: number;
}

function isAllowedImageType(type: string): type is (typeof ALLOWED_IMAGE_TYPES)[number] {
	return ALLOWED_IMAGE_TYPES.includes(type as (typeof ALLOWED_IMAGE_TYPES)[number]);
}

function calculateDimensions(width: number, height: number): { width: number; height: number } {
	const scale = Math.min(1, MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);

	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

export async function importImage(file: File): Promise<ImportedImage> {
	if (!isAllowedImageType(file.type)) {
		throw new Error('Formato de imagen no permitido. Usa PNG o JPEG.');
	}

	if (file.size > MAX_IMAGE_FILE_SIZE) {
		throw new Error('La imagen supera el tamaño máximo permitido de 10 MB.');
	}

	const bitmap = await createImageBitmap(file);

	try {
		const dimensions = calculateDimensions(bitmap.width, bitmap.height);

		const canvas = document.createElement('canvas');

		canvas.width = dimensions.width;
		canvas.height = dimensions.height;

		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('No se pudo preparar la imagen.');
		}

		context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

		return {
			// Siempre PNG (sin pérdida): el backend solo necesita un decodificador.
			src: canvas.toDataURL('image/png'),
			widthPx: dimensions.width,
			heightPx: dimensions.height,
		};
	} finally {
		bitmap.close();
	}
}
