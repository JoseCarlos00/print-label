import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import type { LabelElement, TextAlign } from 'shared';
import { useEditorStore } from '../../store/useEditorStore';
import { mmToPx, pxToMm } from '../../utils/scale';
import type { CSSProperties } from 'react';

import { BarcodePreview, InvalidBarcodePreview } from './previews/BarcodePreview';
import { QrPreview } from './previews/QrPreview';
import { PreviewErrorBoundary } from './previews/PreviewErrorBoundary';


interface CanvasElementProps {
	element: LabelElement;
	isSelected: boolean;
	canvasWidthMm: number;
	canvasHeightMm: number;
	dpi: number;
}

const TEXT_ALIGN_CSS: Record<TextAlign, CSSProperties['textAlign']> = {
	L: 'left',
	C: 'center',
	R: 'right',
	J: 'justify',
};

export function CanvasElement({ element, isSelected, canvasWidthMm, canvasHeightMm, dpi }: CanvasElementProps) {
	const positionLocked = useEditorStore((s) => s.positionLocked);
	const selectElement = useEditorStore((s) => s.selectElement);
	const updateElement = useEditorStore((s) => s.updateElement);
	const rotateElement = useEditorStore((s) => s.rotateElement);
	const duplicateElement = useEditorStore((s) => s.duplicateElement);
	const removeElement = useEditorStore((s) => s.removeElement);

	const dragOffsetMm = useRef<{ dx: number; dy: number } | null>(null);
	const draggable = !positionLocked;

	const elementRef = useRef<HTMLDivElement>(null);
	const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

	const cursorToMm = (e: PointerEvent<HTMLDivElement>) => {
		const canvasRect = e.currentTarget.parentElement!.getBoundingClientRect();
		return { x: pxToMm(e.clientX - canvasRect.left), y: pxToMm(e.clientY - canvasRect.top) };
	};

	const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
		e.stopPropagation();

		if ((e.target as HTMLElement).closest('[data-element-toolbar]')) return;

		selectElement(element.id);
		if (!draggable) return;

		e.currentTarget.setPointerCapture(e.pointerId);
		const cursor = cursorToMm(e);
		dragOffsetMm.current = { dx: cursor.x - element.x, dy: cursor.y - element.y };
	};

	const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
		if (!draggable || !dragOffsetMm.current) return;

		const cursor = cursorToMm(e);
		const xMm = Math.max(0, Math.min(cursor.x - dragOffsetMm.current.dx, canvasWidthMm));
		const yMm = Math.max(0, Math.min(cursor.y - dragOffsetMm.current.dy, canvasHeightMm));
		updateElement(element.id, { x: xMm, y: yMm });
	};

	const handlePointerUp = () => {
		dragOffsetMm.current = null;
	};

	// offsetWidth/offsetHeight ignoran `transform`, así que dan el tamaño
	// SIN ROTAR del elemento aunque ya tenga rotate() aplicado. Lo necesitamos
	// para compensar la posición a 90°/270°, donde ancho y alto se intercambian.
	useLayoutEffect(() => {
		const node = elementRef.current;
		if (!node) return;

		const observer = new ResizeObserver(() => {
			setNaturalSize({ width: node.offsetWidth, height: node.offsetHeight });
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, [element.type]);

	// ...dragOffsetMm, cursorToMm, handlePointerDown/Move/Up SIN CAMBIOS
	// (no dependen de la rotación visual, así que siguen funcionando igual)...

	// A 90°/270° el bounding box visual intercambia ancho y alto. Rotando
	// sobre el centro (default de CSS), a 0°/180° la caja no se mueve —
	// pero a 90°/270° queda centrada en un punto distinto al esperado, así
	// que corregimos left/top para que la esquina superior izquierda del
	// elemento YA ROTADO caiga siempre en (x,y), igual que a 0°/180°.
	const isSideways = element.rotation === 90 || element.rotation === 270;
	const offsetXPx = isSideways ? (naturalSize.height - naturalSize.width) / 2 : 0;
	const offsetYPx = isSideways ? (naturalSize.width - naturalSize.height) / 2 : 0;

	return (
		<div
			ref={elementRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			style={{
				position: 'absolute',
				left: mmToPx(element.x) + offsetXPx,
				top: mmToPx(element.y) + offsetYPx,
				transform: `rotate(${element.rotation}deg)`,
				cursor: draggable ? 'move' : 'default',
			}}
			className={`select-none ${isSelected ? 'outline-2 outline-app-accent' : ''}`}
		>
			<ElementPreview
				element={element}
				dpi={dpi}
			/>

			{isSelected && !positionLocked && (
				<div
					data-element-toolbar
					className='absolute -top-8 left-0 flex gap-1 rounded-md bg-app-surface p-1 shadow'
				>
					<button
						title='Rotar'
						onClick={(e) => {
							e.stopPropagation();
							rotateElement(element.id);
						}}
						className='rounded px-1.5 text-xs hover:bg-app-border'
					>
						⟳
					</button>

					<button
						title='Duplicar'
						onClick={(e) => {
							e.stopPropagation();
							duplicateElement(element.id);
						}}
						className='rounded px-1.5 text-xs hover:bg-app-border'
					>
						⧉
					</button>

					<button
						title='Eliminar'
						onClick={(e) => {
							e.stopPropagation();
							removeElement(element.id);
						}}
						className='rounded px-1.5 text-xs text-red-400 hover:bg-app-border'
					>
						✕
					</button>
				</div>
			)}
		</div>
	);
}

// Render aproximado — no es el ZPL real. Barcode/QR quedan como placeholders
// hasta que integremos una librería de render (jsbarcode / qrcode.react) o
// el preview real vía Labelary.
function ElementPreview({ element, dpi }: { element: LabelElement, dpi: number }) {
	switch (element.type) {
		case 'text': {
			const baseStyle: CSSProperties = {
				fontSize: mmToPx(element.fontSize),
				fontWeight: element.bold ? '800' : 'inherit',
				color: 'black',
				fontStretch: element.bold ? 'initial' : 'semi-condensed',
				letterSpacing: '0.035rem',
			};

			if (element.wrapWidth === undefined) {
				return (
					<span
						style={baseStyle}
						className='whitespace-nowrap'
					>
						{element.content || 'Texto'}
					</span>
				);
			}

			return (
				<span
					style={{
						...baseStyle,
						display: 'block',
						width: mmToPx(element.wrapWidth),
						whiteSpace: 'normal',
						overflowWrap: 'break-word',
						textAlign: TEXT_ALIGN_CSS[element.textAlign ?? 'L'],
						lineHeight: element.lineSpacing ? `${element.fontSize + element.lineSpacing}mm` : 'normal',
					}}
					className='whitespace-nowrap text-black'
				>
					{element.content || 'Texto'}
				</span>
			);
		}
		case 'barcode':
			return (
				<PreviewErrorBoundary
					key={`${element.content}-${element.symbology}`}
					fallback={<InvalidBarcodePreview symbology={element.symbology} />}
				>
					<BarcodePreview element={element} />
				</PreviewErrorBoundary>
			);

		case 'qr':
			return (
				<PreviewErrorBoundary
					key={element.content}
					fallback={<InvalidBarcodePreview symbology='code128' />}
				>
					<QrPreview
						element={element}
						dpi={dpi}
					/>
				</PreviewErrorBoundary>
			);
	}
}
