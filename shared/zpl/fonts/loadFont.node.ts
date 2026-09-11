import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'opentype.js';
import type { Font } from 'opentype.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_PATH = path.join(__dirname, 'tt0003m_.ttf');

let fontPromise: Promise<Font> | null = null;

export function loadSwiss721(): Promise<Font> {
	if (!fontPromise) {
		fontPromise = (async () => {
			const buffer = readFileSync(FONT_PATH);
			const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
			return parse(arrayBuffer);
		})();
	}
	return fontPromise;
}
