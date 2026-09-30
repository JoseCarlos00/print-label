import { useEffect, useRef, useState } from 'react';

import type { ImageElement } from 'shared';
import { createImageGraphicBitmap, type RgbaImage } from 'shared/zpl';

import { useEditorStore } from '@/store/useEditorStore';
import { mmToPx } from '@/utils/scale';
import { bitmapToImageData } from '@/utils/bitmapToImageData';
import { decodeImageSrc } from '@/utils/imageDecode';
import { InvalidPreview } from './InvalidPreview';

interface DecodedState {
	src: string;
	image: RgbaImage | null; // null = falló la decodificación
}

export function ImagePreview({ element, dpi: dpiOverride }: { element: ImageElement; dpi?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frameRef = useRef<number | null>(null);
	const [decoded, setDecoded] = useState<DecodedState | null>(null);

	const profile = useEditorStore((s) => s.profile);
	const dpi = dpiOverride ?? profile?.dpi ?? 203;

	const { id, src, width, height } = element;

	const isCurrent = decoded?.src === src;
	const image = isCurrent ? decoded.image : null;
	const hasFailed = isCurrent && decoded.image === null;

	// 1. Decodificar el data URL (cacheado) a píxeles RGBA.
	useEffect(() => {
		let cancelled = false;

		decodeImageSrc(src)
			.then((result) => {
				if (!cancelled) setDecoded({ src, image: result });
			})
			.catch(() => {
				if (!cancelled) setDecoded({ src, image: null });
			});

		return () => {
			cancelled = true;
		};
	}, [src]);

	// 2. Mismo pipeline que el ZPL (gris → reducción → Floyd-Steinberg).
	// Depende solo de width/height/dpi: mover el elemento no vuelve a hacer el dithering.
	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas || !image) return;

		if (frameRef.current !== null) {
			cancelAnimationFrame(frameRef.current);
		}

		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = null;

			try {
				const bitmap = createImageGraphicBitmap({ id, width, height }, dpi, image);

				canvas.width = bitmap.widthDots;
				canvas.height = bitmap.heightDots;

				const context = canvas.getContext('2d');

				if (!context) return;

				context.putImageData(bitmapToImageData(context, bitmap), 0, 0);
			} catch {
				// Dimensiones inválidas mientras se edita: se conserva el último frame.
			}
		});

		return () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
		};
	}, [image, id, width, height, dpi]);

	if (hasFailed) {
		return <InvalidPreview message='No se pudo cargar la imagen' />;
	}

	return (
		<div
			style={{
				position: 'relative',
				width: mmToPx(width),
				height: mmToPx(height),
			}}
		>
			<canvas
				ref={canvasRef}
				style={{ width: '100%', height: '100%', display: 'block' }}
			/>
		</div>
	);
}
