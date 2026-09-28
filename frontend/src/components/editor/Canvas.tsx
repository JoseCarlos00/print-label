import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { CanvasElement } from './CanvasElement';
import { GuidesOverlay } from './GuidesOverlay';
import { SelectionHandles } from './SelectionHandles';
import { mmToPx, pxToMm } from '@/utils/scale';
import { getAlignmentPoints, getElementBounds, getResizeBounds, getSelectionCorners } from '@/utils/geometry/elementBounds';
import { findAlignmentMatches, getSnapOffset } from '@/utils/geometry/alignment';
import { calculateResize, type ResizeHandle } from '@/utils/geometry/resize';
import { applyResizeToElement } from '@/utils/geometry/applyResize';
import { beginHistoryTransaction, commitHistoryTransaction } from '@/store/history'
import type { LabelElement } from 'shared'

interface CanvasProps {
	loadError?: string | null;
}

interface NaturalSize {
	width: number;
	height: number;
}

interface Guide {
	orientation: 'vertical' | 'horizontal';
	position: number;
}

export function Canvas({ loadError }: CanvasProps) {
	const canvasRef = useRef<HTMLDivElement>(null);

	const [naturalSizes, setNaturalSizes] = useState<Record<string, NaturalSize>>({});
	const [guides, setGuides] = useState<Guide[]>([]);
	const [resizeState, setResizeState] = useState<{
		elementId: string;
		handle: ResizeHandle;
		bounds: ReturnType<typeof getElementBounds>;
		element: LabelElement;
	} | null>(null);

	const profile = useEditorStore((s) => s.profile);
	const elements = useEditorStore((s) => s.elements);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const selectElement = useEditorStore((s) => s.selectElement);
	const updateElement = useEditorStore((s) => s.updateElement);
	const positionLocked = useEditorStore((s) => s.positionLocked);

	const selectedElement = elements.find((element) => element.id === selectedElementId);

	const handleNaturalSizeChange = useCallback((elementId: string, size: NaturalSize) => {
		setNaturalSizes((current) => {
			const previous = current[elementId];

			if (previous?.width === size.width && previous?.height === size.height) {
				return current;
			}

			return {
				...current,
				[elementId]: size,
			};
		});
	}, []);

	const handleDragPositionChange = useCallback(
		(elementId: string, x: number, y: number) => {
			const draggedElement = elements.find((element) => element.id === elementId);

			if (!draggedElement) return;

			const naturalSize = naturalSizes[elementId];

			if (!naturalSize) return;

			const bounds = getElementBounds(
				{
					...draggedElement,
					x,
					y,
				},
				naturalSize,
			);

			const sourcePoints = getAlignmentPoints(bounds);

			const targets = elements
				.filter((element) => element.id !== elementId)
				.map((element) => {
					const size = naturalSizes[element.id];

					if (!size) return null;

					const targetBounds = getElementBounds(element, size);

					return {
						elementId: element.id,
						points: getAlignmentPoints(targetBounds),
					};
				})
				.filter(
					(
						target,
					): target is {
						elementId: string;
						points: ReturnType<typeof getAlignmentPoints>;
					} => target !== null,
				);

			if (!profile) return;

			const matches = findAlignmentMatches(sourcePoints, targets, {
				left: 0,
				centerX: profile.widthMm / 2,
				right: profile.widthMm,
				top: 0,
				centerY: profile.heightMm / 2,
				bottom: profile.heightMm,
			});

			setGuides(
				matches.map((match) => ({
					orientation: match.orientation,
					position: match.position,
				})),
			);

			let snappedX = x;
			let snappedY = y;

			const verticalMatch = matches.find((match) => match.orientation === 'vertical');

			const horizontalMatch = matches.find((match) => match.orientation === 'horizontal');

			if (verticalMatch) {
				snappedX += getSnapOffset(verticalMatch, sourcePoints);
			}

			if (horizontalMatch) {
				snappedY += getSnapOffset(horizontalMatch, sourcePoints);
			}

			updateElement(elementId, {
				x: snappedX,
				y: snappedY,
			});
		},
		[elements, naturalSizes, profile, updateElement],
	);

	const handleDragEnd = useCallback(() => {
		setGuides([]);
	}, []);

	const selectedCorners =
		selectedElement && naturalSizes[selectedElement.id]
			? getSelectionCorners(getResizeBounds(selectedElement, naturalSizes[selectedElement.id]))
			: null;

	const handleBottomRightPointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			event.stopPropagation();
			event.preventDefault();

			if (positionLocked) return;
			if (!selectedElement) return;

			// Por ahora probamos únicamente rotación 0°.
			if (selectedElement.rotation !== 0) return;

			const naturalSize = naturalSizes[selectedElement.id];

			if (!naturalSize) return;

			const bounds = getResizeBounds(selectedElement, naturalSize);

			beginHistoryTransaction();

			setResizeState({
				elementId: selectedElement.id,
				handle: 'bottomRight',
				bounds,
				element: selectedElement,
			});
		},
		[positionLocked, selectedElement, naturalSizes],
	);

	useEffect(() => {
		if (!resizeState) return;

		const handlePointerMove = (event: globalThis.PointerEvent) => {
			const canvas = canvasRef.current;

			if (!canvas) return;

			const element = resizeState.element;

			const canvasRect = canvas.getBoundingClientRect();

			const cursorX = pxToMm(event.clientX - canvasRect.left);

			const cursorY = pxToMm(event.clientY - canvasRect.top);

			const keepAspectRatio = element.type === 'barcode' ? element.lockAspectRatio : true;

			const result = calculateResize({
				bounds: resizeState.bounds,
				handle: resizeState.handle,
				cursorX,
				cursorY,
				keepAspectRatio,
			});

			const resizedElement = applyResizeToElement(element, resizeState.bounds, result);

			updateElement(element.id, resizedElement);
		};

		window.addEventListener('pointermove', handlePointerMove);

		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
		};
	}, [resizeState, elements, updateElement]);

	useEffect(() => {
		if (!resizeState) return;

		const handlePointerUp = () => {
			commitHistoryTransaction();
			setResizeState(null);
		};

		window.addEventListener('pointerup', handlePointerUp);

		return () => {
			window.removeEventListener('pointerup', handlePointerUp);
		};
	}, [resizeState]);

	if (loadError) {
		return (
			<div className='flex flex-1 items-center justify-center bg-app-bg p-8'>
				<p className='text-sm text-red-400'>{loadError}</p>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className='flex flex-1 items-center justify-center bg-app-bg p-8'>
				<p className='text-sm text-app-text-muted'>Cargando lienzo...</p>
			</div>
		);
	}

	return (
		<div className='flex min-w-0 flex-1 flex-col items-center justify-center bg-app-bg p-8 overflow-auto thin-scrollbar'>
			<div
				ref={canvasRef}
				style={{
					width: mmToPx(profile.widthMm),
					height: mmToPx(profile.heightMm),
					backgroundImage: `
						linear-gradient(to right, rgba(100, 100, 100, 0.12) 1px, transparent 1px),
						linear-gradient(to bottom, rgba(100, 100, 100, 0.12) 1px, transparent 1px),
						linear-gradient(to right, rgba(80, 80, 80, 0.28) 1px, transparent 1px),
						linear-gradient(to bottom, rgba(80, 80, 80, 0.28) 1px, transparent 1px)
					`,
					backgroundSize: `
							10px 10px,
							10px 10px,
							50px 50px,
							50px 50px
					`,
				}}
				className='relative border border-app-border bg-app-surface zebra-font-emulated'
			>
				<GuidesOverlay
					guides={guides}
					widthMm={profile.widthMm}
					heightMm={profile.heightMm}
				/>

				{elements.map((el) => (
					<CanvasElement
						key={el.id}
						element={el}
						isSelected={el.id === selectedElementId}
						canvasWidthMm={profile.widthMm}
						canvasHeightMm={profile.heightMm}
						onNaturalSizeChange={handleNaturalSizeChange}
						onDragPositionChange={handleDragPositionChange}
						onDragEnd={handleDragEnd}
					/>
				))}

				{selectedCorners && (
					<SelectionHandles
						corners={selectedCorners}
						onBottomRightPointerDown={handleBottomRightPointerDown}
					/>
				)}
			</div>
		</div>
	);
}
