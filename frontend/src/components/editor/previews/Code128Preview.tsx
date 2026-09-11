import { useEffect, useRef } from 'react';
import type { BarcodeElement } from 'shared';
import { createCode128Bitmap } from 'shared/zpl';
import { useEditorStore } from '../../../store/useEditorStore';
import { mmToPx } from '../../../utils/scale';

export function Code128Preview({ element }: { element: BarcodeElement }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const profile = useEditorStore((s) => s.profile);
	const dpi = profile?.dpi ?? 203;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const bitmap = createCode128Bitmap(element, dpi);

		canvas.width = bitmap.widthDots;
		canvas.height = bitmap.heightDots;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const imageData = ctx.createImageData(bitmap.widthDots, bitmap.heightDots);

		for (let y = 0; y < bitmap.heightDots; y++) {
			for (let x = 0; x < bitmap.widthDots; x++) {
				const byteIndex = y * bitmap.bytesPerRow + Math.floor(x / 8);

				const bitIndex = 7 - (x % 8);

				const isBlack = (bitmap.data[byteIndex] & (1 << bitIndex)) !== 0;

				const pixelIndex = (y * bitmap.widthDots + x) * 4;

				const value = isBlack ? 0 : 255;

				imageData.data[pixelIndex] = value;
				imageData.data[pixelIndex + 1] = value;
				imageData.data[pixelIndex + 2] = value;
				imageData.data[pixelIndex + 3] = 255;
			}
		}

		ctx.putImageData(imageData, 0, 0);
	}, [element, dpi]);

	return (
		<canvas
			ref={canvasRef}
			style={{
				width: mmToPx(element.width),
				height: mmToPx(element.height),
				display: 'block',
			}}
		/>
	);
}
