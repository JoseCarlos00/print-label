import { timingSafeEqual } from 'node:crypto';

/**
 * Compara dos strings en tiempo constante para evitar timing attacks.
 * Si las longitudes difieren, igual se hace una comparación de buffers
 * de igual tamaño para que la función tarde aproximadamente lo mismo
 * en ambos casos (evita filtrar la longitud por timing).
 */
export function safeCompare(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);

	if (bufA.length !== bufB.length) {
		timingSafeEqual(bufA, Buffer.alloc(bufA.length));
		return false;
	}

	return timingSafeEqual(bufA, bufB);
}
