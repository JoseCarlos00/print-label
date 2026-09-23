import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import type { LabelElement } from 'shared';
import { useEditorStore } from '@/store/useEditorStore';
import { beginHistoryTransaction, commitHistoryTransaction } from '@/store/history';
import { mmToPx, pxToMm } from '@/utils/scale';

import { BarcodePreview } from './previews/BarcodePreview';
import { QrPreview } from './previews/QrPreview';
import { PreviewErrorBoundary } from './previews/PreviewErrorBoundary';
import { TextPreview } from './previews/TextPreview';
import { OutOfBoundsWarning } from './OutOfBoundsWarning';
import { getElementBounds } from '@/utils/geometry/elementBounds'

interface CanvasElementProps {
	element: LabelElement;
	isSelected: boolean;
	canvasWidthMm: number;
	canvasHeightMm: number;
}

interface Actions {
	rotateElement: (id: string) => void;
	duplicateElement: (id: string) => void;
	removeElement: (id: string) => void;
}

export function CanvasElement({ element, isSelected, canvasWidthMm, canvasHeightMm }: CanvasElementProps) {
	const positionLocked = useEditorStore((s) => s.positionLocked);
	const selectElement = useEditorStore((s) => s.selectElement);
	const updateElement = useEditorStore((s) => s.updateElement);
	const rotateElement = useEditorStore((s) => s.rotateElement);
	const duplicateElement = useEditorStore((s) => s.duplicateElement);
	const removeElement = useEditorStore((s) => s.removeElement);
	const requestContentFocus = useEditorStore((s) => s.requestContentFocus);

	const actions: Actions = {
		rotateElement,
		duplicateElement,
		removeElement,
	};

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

			beginHistoryTransaction();

			e.currentTarget.setPointerCapture(e.pointerId);
			const cursor = cursorToMm(e);
			dragOffsetMm.current = { dx: cursor.x - element.x, dy: cursor.y - element.y };
		};

	const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
		if (!draggable || !dragOffsetMm.current) return;

		const cursor = cursorToMm(e);
		const xMm = cursor.x - dragOffsetMm.current.dx;
		const yMm = cursor.y - dragOffsetMm.current.dy;
		updateElement(element.id, { x: xMm, y: yMm });
	};

	const handlePointerUp = () => {
		dragOffsetMm.current = null;
		commitHistoryTransaction();
	};

	const handleDoubleClick = (e: PointerEvent<HTMLDivElement>) => {
		e.stopPropagation();

		if ((e.target as HTMLElement).closest('[data-element-toolbar]')) return;

		selectElement(element.id);
		requestContentFocus();
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

	const bounds = getElementBounds(element, naturalSize);


	// Evita falso positivo antes de que ResizeObserver mida por primera vez
	const hasMeasured = naturalSize.width > 0 && naturalSize.height > 0;

	const isOutOfBounds =
		hasMeasured &&
		(bounds.left < 0 || bounds.top < 0 || bounds.right > canvasWidthMm || bounds.bottom > canvasHeightMm);

	return (
		<>
			<div
				ref={elementRef}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onDoubleClick={handleDoubleClick}
				style={{
					position: 'absolute',
					left: mmToPx(bounds.left),
					top: mmToPx(bounds.top),
					transform: `rotate(${element.rotation}deg)`,
					cursor: draggable ? 'move' : 'default',
				}}
				className={`select-none ${draggable ? 'touch-none' : ''} ${isSelected ? 'outline-2 outline-app-accent-500' : ''}`}
			>
				<ElementPreview element={element} />

				{isSelected && !positionLocked && (
					<ActionsButtons
						element={element}
						actions={actions}
					/>
				)}
			</div>

			{isOutOfBounds && (
				<OutOfBoundsWarning
					x={mmToPx(bounds.centerX)}
					y={mmToPx(bounds.centerY)}
				/>
			)}
		</>
	);
}

function ElementPreview({ element }: { element: LabelElement }) {
	switch (element.type) {
		case 'text':
			return (
				<PreviewErrorBoundary resetKey={element}>
					<TextPreview element={element} />
				</PreviewErrorBoundary>
			);

		case 'barcode':
			return (
				<PreviewErrorBoundary resetKey={element}>
					<BarcodePreview element={element} />
				</PreviewErrorBoundary>
			);

		case 'qr':
			return (
				<PreviewErrorBoundary resetKey={element}>
					<QrPreview element={element} />
				</PreviewErrorBoundary>
			);
	}
}

interface ActionsButtonsProps {
	element: LabelElement;
	actions: Actions;
}

function ActionsButtons({ element, actions }: ActionsButtonsProps) {
	return (
		<div
			data-element-toolbar
			className='absolute -top-8 left-0 flex gap-1 rounded-md bg-app-surface p-1 shadow'
		>
			<button
				title='Rotar'
				onClick={(e) => {
					e.stopPropagation();
					actions.rotateElement(element.id);
				}}
				className='rounded px-1.5 text-xs hover:bg-app-border cursor-pointer'
			>
				⟳
			</button>

			<button
				title='Duplicar'
				onClick={(e) => {
					e.stopPropagation();
					actions.duplicateElement(element.id);
				}}
				className='rounded px-1.5 text-xs hover:bg-app-border cursor-pointer'
			>
				⧉
			</button>

			<button
				title='Eliminar'
				onClick={(e) => {
					e.stopPropagation();
					actions.removeElement(element.id);
				}}
				className='rounded px-1.5 text-xs text-red-400 hover:bg-app-border cursor-pointer'
			>
				✕
			</button>
		</div>
	);
}
