import type { RgbaImage } from 'shared/zpl';

const CACHE_LIMIT = 16;
const cache = new Map<string, Promise<RgbaImage>>();

async function decode(src: string): Promise<RgbaImage> {
	const response = await fetch(src);
	const blob = await response.blob();

	// Sin conversión de color ni premultiplicado, para acercarnos a lo que decodifica pngjs.
	const bitmap = await createImageBitmap(blob, {
		colorSpaceConversion: 'none',
		premultiplyAlpha: 'none',
	});

	try {
		const canvas = document.createElement('canvas');
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;

		const context = canvas.getContext('2d', { willReadFrequently: true });

		if (!context) {
			throw new Error('No se pudo decodificar la imagen.');
		}

		context.drawImage(bitmap, 0, 0);

		const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);

		return { width: bitmap.width, height: bitmap.height, data };
	} finally {
		bitmap.close();
	}
}

export function decodeImageSrc(src: string): Promise<RgbaImage> {
	const cached = cache.get(src);

	if (cached) return cached;

	const promise = decode(src);

	cache.set(src, promise);

	promise.catch(() => cache.delete(src));

	if (cache.size > CACHE_LIMIT) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}

	return promise;
}
