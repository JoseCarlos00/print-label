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

export function barsToBitmap(bars: string, widthDots: number, heightDots: number): GraphicBitmap {
	const bytesPerRow = Math.ceil(widthDots / 8);
	const data = new Uint8Array(bytesPerRow * heightDots);

	for (let moduleIndex = 0; moduleIndex < bars.length; moduleIndex++) {
		if (bars[moduleIndex] !== '1') continue;

		const startX = Math.floor((moduleIndex * widthDots) / bars.length);

		const endX = Math.floor(((moduleIndex + 1) * widthDots) / bars.length);

		for (let x = startX; x < endX; x++) {
			const byteIndex = Math.floor(x / 8);
			const bitIndex = 7 - (x % 8);

			for (let y = 0; y < heightDots; y++) {
				const index = y * bytesPerRow + byteIndex;
				data[index] |= 1 << bitIndex;
			}
		}
	}

	return {
		widthDots,
		heightDots,
		bytesPerRow,
		data,
	};
}

export function drawBitmap(destination: GraphicBitmap, source: GraphicBitmap, offsetX: number, offsetY: number): void {
	for (let sourceY = 0; sourceY < source.heightDots; sourceY++) {
		for (let sourceX = 0; sourceX < source.widthDots; sourceX++) {
			const sourceByteIndex = sourceY * source.bytesPerRow + Math.floor(sourceX / 8);

			const sourceBitIndex = 7 - (sourceX % 8);

			const isBlack = (source.data[sourceByteIndex] & (1 << sourceBitIndex)) !== 0;

			if (!isBlack) continue;

			setPixel(destination, offsetX + sourceX, offsetY + sourceY);
		}
	}
}

export function setPixel(bitmap: GraphicBitmap, x: number, y: number): void {
	if (x < 0 || x >= bitmap.widthDots || y < 0 || y >= bitmap.heightDots) {
		return;
	}

	const byteIndex = y * bitmap.bytesPerRow + Math.floor(x / 8);

	const bitIndex = 7 - (x % 8);

	bitmap.data[byteIndex] |= 1 << bitIndex;
}
