import type { QrElement } from 'shared';
import { createQrBitmap } from 'shared/zpl'

import { useEffect, useRef } from 'react';
import type { Font, GraphicBitmap } from 'shared/zpl';
import { useEditorStore } from '../../../store/useEditorStore';
import { mmToPx } from '../../../utils/scale';

import { loadSwiss721 } from 'shared/zpl/font';
const font = await loadSwiss721();

export function QrPreview({ element }: { element: QrElement }) {
	return (
		<QrBitmapPreview
			element={element}
			createBitmap={createQrBitmap}
		/>
	);
}


interface QrBitmapPreviewProps {
	element: QrElement;
	createBitmap: (element: QrElement, dpi: number, font: Font) => GraphicBitmap;
}

function QrBitmapPreview({ element, createBitmap }: QrBitmapPreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	
	const profile = useEditorStore((s) => s.profile);
	const dpi = profile?.dpi ?? 203;
	
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		
		const bitmap = createBitmap(element, dpi, font);

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
	}, [element, dpi, createBitmap]);

	return (
		<div
			style={{
				position: 'relative',
				width: mmToPx(element.size),
				height: mmToPx(element.size),
			}}
		>
			<canvas
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
					display: 'block',
				}}
			/>
		</div>
	);
}
