// Escala base fija. El zoom de pantalla se aplica visualmente al canvas, sin
// alterar estas conversiones ni las medidas físicas guardadas.
export const PX_PER_MM = 4;

export function mmToPx(mm: number): number {
	return mm * PX_PER_MM;
}

export function pxToMm(px: number): number {
	return px / PX_PER_MM;
}

export function mmToDots(mm: number, dpi: number): number {
	return (mm * dpi) / 25.4;
}

export function dotsToMm(dots: number, dpi: number): number {
	return (dots * 25.4) / dpi;
}
