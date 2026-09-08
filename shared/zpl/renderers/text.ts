import type { TextAlign, TextElement } from '../../types.js';
import { escapeZplField, mmToDots, ROTATION_MAP } from '../units.js'

/**
 * Ratio ancho/alto de carácter para simular negrita en ^A0 (ZPL no tiene
 * negrita real). Probado y confirmado: 1.4.
 */
export const BOLD_WIDTH_RATIO = 1.4;

// ──────────────────────────────────────────────────────────────────────────
// Texto
// ──────────────────────────────────────────────────────────────────────────

/**
 * Tope de líneas fijo para ^FB cuando el texto usa wrapWidth. No es
 * configurable desde el modelo de datos a propósito — es una salvaguarda
 * interna para que un texto excesivamente largo no desborde la etiqueta
 * verticalmente sin que nadie se dé cuenta hasta imprimir.
 */
const MAX_WRAP_LINES = 10;

const TEXT_ALIGN_DEFAULT: TextAlign = 'L';

export function buildTextCommand(el: TextElement, dpi: number): string {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);
	const heightDots = mmToDots(el.fontSize, dpi);
	const widthDots = el.bold ? Math.round(heightDots * BOLD_WIDTH_RATIO) : heightDots;
	const orientation = ROTATION_MAP[el.rotation];
	const content = escapeZplField(el.content);

	const commands = [`^FO${xDots},${yDots}`];

	// ^FB (field block): activa texto multilínea con ancho fijo. Solo se
	// incluye si el elemento define wrapWidth — comportamiento por default
	// sigue siendo una sola línea, sin cambios respecto a la versión anterior.
	if (el.wrapWidth !== undefined) {
		const wrapWidthDots = mmToDots(el.wrapWidth, dpi);
		const lineSpacingDots = mmToDots(el.lineSpacing ?? 0, dpi);
		const textAlign = el.textAlign ?? TEXT_ALIGN_DEFAULT;
		commands.push(`^FB${wrapWidthDots},${MAX_WRAP_LINES},${lineSpacingDots},${textAlign},0`);
	}

	commands.push(`^A0${orientation},${heightDots},${widthDots}`, `^FH^FD${content}^FS`);

	return commands.join('\n');
}
