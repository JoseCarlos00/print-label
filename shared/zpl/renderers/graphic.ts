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

export function rotateBitmap(bitmap: GraphicBitmap, rotation: 0 | 90 | 180 | 270): GraphicBitmap {
	if (rotation === 0) {
		return bitmap;
	}

	const sourceWidth = bitmap.widthDots;
	const sourceHeight = bitmap.heightDots;

	const targetWidth = rotation === 90 || rotation === 270 ? sourceHeight : sourceWidth;

	const targetHeight = rotation === 90 || rotation === 270 ? sourceWidth : sourceHeight;

	const targetBytesPerRow = Math.ceil(targetWidth / 8);
	const targetData = new Uint8Array(targetBytesPerRow * targetHeight);

	function getPixel(x: number, y: number): boolean {
		const byteIndex = y * bitmap.bytesPerRow + Math.floor(x / 8);
		const bitIndex = 7 - (x % 8);

		return (bitmap.data[byteIndex] & (1 << bitIndex)) !== 0;
	}

	function setPixel(x: number, y: number): void {
		const byteIndex = y * targetBytesPerRow + Math.floor(x / 8);

		const bitIndex = 7 - (x % 8);

		targetData[byteIndex] |= 1 << bitIndex;
	}

	for (let y = 0; y < sourceHeight; y++) {
		for (let x = 0; x < sourceWidth; x++) {
			if (!getPixel(x, y)) {
				continue;
			}

			let targetX: number;
			let targetY: number;

			switch (rotation) {
				case 90:
					targetX = sourceHeight - 1 - y;
					targetY = x;
					break;

				case 180:
					targetX = sourceWidth - 1 - x;
					targetY = sourceHeight - 1 - y;
					break;

				case 270:
					targetX = y;
					targetY = sourceWidth - 1 - x;
					break;
			}

			setPixel(targetX, targetY);
		}
	}

	return {
		widthDots: targetWidth,
		heightDots: targetHeight,
		bytesPerRow: targetBytesPerRow,
		data: targetData,
	};
}
