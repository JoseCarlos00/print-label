import opentype from 'opentype.js';
import type { Font } from 'opentype.js';

const FONT_URL = new URL('./tt0003m_.ttf', import.meta.url).href;

let fontPromise: Promise<Font> | null = null;

export function loadSwiss721(): Promise<Font> {
	if (!fontPromise) {
		fontPromise = (async () => {
			const response = await fetch(FONT_URL);
			const arrayBuffer = await response.arrayBuffer();

			return opentype.parse(arrayBuffer);
		})();
	}

	return fontPromise;
}
