import type { QrElement } from 'shared';
import { createQrBitmap } from 'shared/zpl';
import { useEffect, useRef, useState } from 'react';
import type { Font, GraphicBitmap } from 'shared/zpl';
import { useEditorStore } from '@/store/useEditorStore';
import { mmToPx } from '@/utils/scale';
import { loadSwiss721 } from 'shared/zpl/font';

const font = await loadSwiss721();

export function QrPreview({ element, dpi }: { element: QrElement; dpi?: number }) {
	return (
		<QrBitmapPreview
			element={element}
			createBitmap={createQrBitmap}
			dpi={dpi}
		/>
	);
}

interface QrBitmapPreviewProps {
	element: QrElement;
	createBitmap: (element: QrElement, dpi: number, font: Font) => GraphicBitmap;
	dpi?: number;
}

type BitmapSize = {
	width: number;
	height: number;
};

function dotsToMm(dots: number, dpi: number): number {
	return (dots * 25.4) / dpi;
}

function QrBitmapPreview({ element, createBitmap, dpi: dpiOverride }: QrBitmapPreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frameRef = useRef<number | null>(null);

	const profile = useEditorStore((s) => s.profile);

	const dpi = dpiOverride ?? profile?.dpi ?? 203;

	const [size, setSize] = useState<BitmapSize>({
		width: mmToPx(element.size),
		height: mmToPx(element.size),
	});

	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) return;

		/*
		 * Si durante el resize llegan varios cambios de element.size
		 * antes del siguiente frame, solo procesamos el último.
		 */
		if (frameRef.current !== null) {
			cancelAnimationFrame(frameRef.current);
		}

		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = null;

			const bitmap = createBitmap(element, dpi, font);

			const nextSize = {
				width: mmToPx(dotsToMm(bitmap.widthDots, dpi)),
				height: mmToPx(dotsToMm(bitmap.heightDots, dpi)),
			};

			setSize((previousSize) => {
				if (previousSize.width === nextSize.width && previousSize.height === nextSize.height) {
					return previousSize;
				}

				return nextSize;
			});

			canvas.width = bitmap.widthDots;
			canvas.height = bitmap.heightDots;

			const ctx = canvas.getContext('2d');

			if (!ctx) return;

			const imageData = ctx.createImageData(bitmap.widthDots, bitmap.heightDots);

			const pixels = imageData.data;

			for (let y = 0; y < bitmap.heightDots; y++) {
				const sourceRowOffset = y * bitmap.bytesPerRow;
				const targetRowOffset = y * bitmap.widthDots * 4;

				for (let byteX = 0; byteX < bitmap.bytesPerRow; byteX++) {
					const byte = bitmap.data[sourceRowOffset + byteX];

					for (let bit = 0; bit < 8; bit++) {
						const x = byteX * 8 + bit;

						// Los últimos bits del último byte pueden quedar fuera del ancho real.
						if (x >= bitmap.widthDots) {
							break;
						}

						const isBlack = (byte & (0x80 >> bit)) !== 0;
						const value = isBlack ? 0 : 255;

						const pixelIndex = targetRowOffset + x * 4;

						pixels[pixelIndex] = value;
						pixels[pixelIndex + 1] = value;
						pixels[pixelIndex + 2] = value;
						pixels[pixelIndex + 3] = 255;
					}
				}
			}

			ctx.putImageData(imageData, 0, 0);
		});

		return () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
		};
	}, [element, dpi, createBitmap]);

	return (
		<div
			style={{
				position: 'relative',
				width: size.width,
				height: size.height,
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
