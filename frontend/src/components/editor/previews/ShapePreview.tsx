import { useEffect, useMemo, useRef } from 'react';

import type { ShapeElement } from 'shared';
import { createShapeBitmap } from 'shared/zpl';
import { useEditorStore } from '@/store/useEditorStore';
import { mmToPx } from '@/utils/scale';
import { bitmapToImageData } from '@/utils/bitmapToImageData';

export function ShapePreview({ element, dpi: dpiOverride }: { element: ShapeElement; dpi?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const profile = useEditorStore((s) => s.profile);
	const dpi = dpiOverride ?? profile?.dpi ?? 203;
	const bitmap = useMemo(() => createShapeBitmap(element, dpi), [element, dpi]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = bitmap.widthDots;
		canvas.height = bitmap.heightDots;

		const context = canvas.getContext('2d');
		if (!context) return;

		context.putImageData(bitmapToImageData(context, bitmap, true), 0, 0);
	}, [bitmap]);

	return (
		<div
			style={{
				width: mmToPx(element.width),
				height: mmToPx(element.height),
			}}
		>
			<canvas
				ref={canvasRef}
				style={{ width: '100%', height: '100%', display: 'block' }}
			/>
		</div>
	);
}
