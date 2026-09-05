// Escala fija por ahora (zoom queda para después). 4 px por mm da un tamaño
// razonable en pantalla para una etiqueta de 4"x4" (101.6mm ≈ 406px).
export const PX_PER_MM = 4;

export function mmToPx(mm: number): number {
	return mm * PX_PER_MM;
}

export function pxToMm(px: number): number {
	return px / PX_PER_MM;
}
