import { useEffect, useRef } from 'react';

import type { BarcodeElement } from 'shared';
import type { Font, GraphicBitmap } from 'shared/zpl';
import { loadSwiss721 } from 'shared/zpl/font';

import { useEditorStore } from '@/store/useEditorStore';
import { mmToPx } from '@/utils/scale';
import { bitmapToImageData } from '@/utils/bitmapToImageData';

const font = await loadSwiss721();

interface BarcodeBitmapPreviewProps {
	element: BarcodeElement;
	createBitmap: (element: BarcodeElement, dpi: number, font: Font) => GraphicBitmap;
	dpi?: number;
}

export function BarcodeBitmapPreview({ element, createBitmap, dpi: dpiOverride }: BarcodeBitmapPreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const profile = useEditorStore((s) => s.profile);
	const dpi = dpiOverride ?? profile?.dpi ?? 203;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const bitmap = createBitmap(element, dpi, font);

		canvas.width = bitmap.widthDots;
		canvas.height = bitmap.heightDots;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const imageData = bitmapToImageData(ctx, bitmap);

		ctx.putImageData(imageData, 0, 0);
	}, [element, dpi, createBitmap]);

	return (
		<div
			style={{
				position: 'relative',
				width: mmToPx(element.width),
				height: mmToPx(element.height),
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
