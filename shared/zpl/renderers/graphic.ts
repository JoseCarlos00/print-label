export interface GraphicBitmap {
	widthDots: number;
	heightDots: number;
	bytesPerRow: number;
	data: Uint8Array;
}

export function bytesToHex(data: Uint8Array): string {
	let result = '';

	for (const byte of data) {
		result += byte.toString(16).padStart(2, '0').toUpperCase();
	}

	return result;
}

export function buildGraphicCommand(bitmap: GraphicBitmap, position: string): string {
	const totalBytes = bitmap.data.length;
	const hexData = bytesToHex(bitmap.data);

	return [position, `^GFA,${totalBytes},${totalBytes},${bitmap.bytesPerRow},${hexData}`].join('\n');
}
