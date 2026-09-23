import { useLayoutEffect, useRef, useState } from 'react';
import type { LabelElement } from 'shared';
import { mmToPx } from '@/utils/scale';
import { PreviewErrorBoundary } from '@/components/editor/previews/PreviewErrorBoundary';
import { TextPreview } from '@/components/editor/previews/TextPreview';
import { BarcodePreview } from '@/components/editor/previews/BarcodePreview';
import { QrPreview } from '@/components/editor/previews/QrPreview';
import { OutOfBoundsWarning } from '@/components/editor/OutOfBoundsWarning';

interface StaticLabelElementProps {
	element: LabelElement;
	canvasWidthMm: number;
	canvasHeightMm: number;
	dpi: number;
}

// Versión de solo lectura de CanvasElement: mismo cálculo de posición y
// compensación de rotación para 90°/270°, pero sin ningún handler de
// puntero, selección, ni mini-toolbar — es una previsualización, no un
// editor.
export function StaticLabelElement({ element, canvasWidthMm, canvasHeightMm, dpi }: StaticLabelElementProps) {
	const elementRef = useRef<HTMLDivElement>(null);
	const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

	useLayoutEffect(() => {
		const node = elementRef.current;
		if (!node) return;

		const observer = new ResizeObserver(() => {
			setNaturalSize({ width: node.offsetWidth, height: node.offsetHeight });
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, [element.type]);

	const isSideways = element.rotation === 90 || element.rotation === 270;
	const offsetXPx = isSideways ? (naturalSize.height - naturalSize.width) / 2 : 0;
	const offsetYPx = isSideways ? (naturalSize.width - naturalSize.height) / 2 : 0;

	const widthPx = isSideways ? naturalSize.height : naturalSize.width;
	const heightPx = isSideways ? naturalSize.width : naturalSize.height;
	const leftPx = mmToPx(element.x) + offsetXPx;
	const topPx = mmToPx(element.y) + offsetYPx;

	const hasMeasured = naturalSize.width > 0 && naturalSize.height > 0;
	const isOutOfBounds =
		hasMeasured &&
		(leftPx < 0 || topPx < 0 || leftPx + widthPx > mmToPx(canvasWidthMm) || topPx + heightPx > mmToPx(canvasHeightMm));

	return (
		<>
			<div
				ref={elementRef}
				style={{
					position: 'absolute',
					left: mmToPx(element.x) + offsetXPx,
					top: mmToPx(element.y) + offsetYPx,
					transform: `rotate(${element.rotation}deg)`,
				}}
				className='pointer-events-none select-none'
			>
				<StaticElementPreview
					element={element}
					dpi={dpi}
				/>
			</div>

			{isOutOfBounds && (
				<OutOfBoundsWarning
					x={leftPx + widthPx / 2}
					y={topPx + heightPx / 2}
				/>
			)}
		</>
	);
}

function StaticElementPreview({ element, dpi }: { element: LabelElement; dpi: number }) {
	switch (element.type) {
		case 'text':
			return (
				<PreviewErrorBoundary resetKey={element}>
					<TextPreview
						element={element}
						dpi={dpi}
					/>
				</PreviewErrorBoundary>
			);

		case 'barcode':
			return (
				<PreviewErrorBoundary resetKey={element}>
					<BarcodePreview
						element={element}
						dpi={dpi}
					/>
				</PreviewErrorBoundary>
			);

		case 'qr':
			return (
				<PreviewErrorBoundary resetKey={element}>
					<QrPreview
						element={element}
						dpi={dpi}
					/>
				</PreviewErrorBoundary>
			);
	}
}
