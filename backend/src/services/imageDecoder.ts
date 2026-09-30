import pngjs from 'pngjs';
import type { LabelElement } from 'shared';
import { MAX_IMAGE_DIMENSION, ZplValidationError, type RgbaImage } from 'shared/zpl';

// pngjs es CommonJS: el import por defecto es el más seguro bajo ESM.
const { PNG } = pngjs;

const DATA_URL_PREFIX = 'data:image/png;base64,';
const MAX_PNG_BYTES = 8 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function decodePngDataUrl(src: unknown, elementId: string): RgbaImage {
	if (typeof src !== 'string' || !src.startsWith(DATA_URL_PREFIX)) {
		throw new ZplValidationError('La imagen debe ser un PNG en formato data URL', elementId);
	}

	const buffer = Buffer.from(src.slice(DATA_URL_PREFIX.length), 'base64');

	if (buffer.length < 24 || buffer.length > MAX_PNG_BYTES) {
		throw new ZplValidationError('El tamaño de la imagen no es válido', elementId);
	}

	if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
		throw new ZplValidationError('La imagen no es un PNG válido', elementId);
	}

	// Dimensiones del IHDR, leídas ANTES de decodificar (evita bombas de descompresión).
	const width = buffer.readUInt32BE(16);
	const height = buffer.readUInt32BE(20);

	if (width === 0 || height === 0 || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
		throw new ZplValidationError(`La imagen supera el máximo de ${MAX_IMAGE_DIMENSION}px por lado`, elementId);
	}

	try {
		const png = PNG.sync.read(buffer);
		return { width: png.width, height: png.height, data: png.data };
	} catch {
		throw new ZplValidationError('No se pudo decodificar la imagen', elementId);
	}
}

export function decodeImageElements(elements: LabelElement[]): Map<string, RgbaImage> {
	const images = new Map<string, RgbaImage>();

	for (const element of elements) {
		if (element.type === 'image') {
			images.set(element.id, decodePngDataUrl(element.src, element.id));
		}
	}

	return images;
}
