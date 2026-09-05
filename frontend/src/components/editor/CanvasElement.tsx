import { useRef, type PointerEvent } from 'react';
import type { LabelElement } from 'shared';
import { useEditorStore } from '../../store/useEditorStore';
import { mmToPx, pxToMm } from '../../utils/scale';

interface CanvasElementProps {
	element: LabelElement;
	isSelected: boolean;
	canvasWidthMm: number;
	canvasHeightMm: number;
}

export function CanvasElement({ element, isSelected, canvasWidthMm, canvasHeightMm }: CanvasElementProps) {
	const positionLocked = useEditorStore((s) => s.positionLocked);
	const selectElement = useEditorStore((s) => s.selectElement);
	const updateElement = useEditorStore((s) => s.updateElement);
	const rotateElement = useEditorStore((s) => s.rotateElement);
	const duplicateElement = useEditorStore((s) => s.duplicateElement);
	const removeElement = useEditorStore((s) => s.removeElement);

	const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
	const draggable = !positionLocked;

	const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
		e.stopPropagation();

		selectElement(element.id);
		if (!draggable) return;

		e.currentTarget.setPointerCapture(e.pointerId);

		const rect = e.currentTarget.getBoundingClientRect();
		dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
	};

	const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
		if (!draggable || !dragOffset.current) return;

		const canvasRect = e.currentTarget.parentElement!.getBoundingClientRect();
		const xPx = e.clientX - canvasRect.left - dragOffset.current.dx;
		const yPx = e.clientY - canvasRect.top - dragOffset.current.dy;

		const xMm = Math.max(0, Math.min(pxToMm(xPx), canvasWidthMm));
		const yMm = Math.max(0, Math.min(pxToMm(yPx), canvasHeightMm));

		updateElement(element.id, { x: xMm, y: yMm });
	};

	const handlePointerUp = () => {
		dragOffset.current = null;
	};

	return (
		<div
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			style={{
				position: 'absolute',
				left: mmToPx(element.x),
				top: mmToPx(element.y),
				transform: `rotate(${element.rotation}deg)`,
				cursor: draggable ? 'move' : 'default',
			}}
			className={`select-none ${isSelected ? 'outline-2 outline-app-accent' : ''}`}
		>
			<ElementPreview element={element} />

			{isSelected && !positionLocked && (
				<div className='absolute -top-8 left-0 flex gap-1 rounded-md bg-app-surface p-1 shadow'>
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
function ElementPreview({ element }: { element: LabelElement }) {
	switch (element.type) {
		case 'text':
			return (
				<span
					style={{ fontSize: mmToPx(element.fontSize), fontWeight: element.bold ? '800' : 'inherit;', fontStretch: element.bold ? 'initial' : 'semi-condensed' }}
					className='whitespace-nowrap text-black'
				>
					{element.content || 'Texto'}
				</span>
			);
		case 'barcode':
			return (
				<div
					style={{ height: mmToPx(element.height) }}
					className='flex items-center justify-center border border-dashed border-neutral-400 px-2 text-[10px] text-neutral-600'
				>
					[{element.symbology}] {element.content}
				</div>
			);
		case 'qr':
			return (
				<div
					style={{ width: mmToPx(element.size * 5), height: mmToPx(element.size * 5) }}
					className='flex items-center justify-center border border-dashed border-neutral-400 text-[10px] text-neutral-600'
				>
					QR
				</div>
			);
	}
}
