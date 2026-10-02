import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { LabelElement } from 'shared';

import { useEditorStore } from '@/store/useEditorStore';
import { beginHistoryTransaction, commitHistoryTransaction } from '@/store/history';

import { CanvasElement } from './CanvasElement';
import { GuidesOverlay } from './GuidesOverlay';
import { SelectionHandles } from './SelectionHandles';
import { ErrorState, LoadingState } from '@/components/ui/state-panels';

import { mmToPx, pxToMm } from '@/utils/scale';
import {
	getAlignmentPoints,
	getElementBounds,
	getQrSelectionCorners,
	getResizeBounds,
	getSelectionCorners,
} from '@/utils/geometry/elementBounds';
import { findAlignmentMatches, getSnapOffset } from '@/utils/geometry/alignment';
import { calculateResize, type ResizeHandle } from '@/utils/geometry/resize';
import { applyResizeToElement } from '@/utils/geometry/applyResize';

import { EDITOR_LIMITS } from '@/config/editorLimits';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface CanvasProps {
	loadError?: string | null;
	loadErrorActions?: ReactNode;
	verticalCenterOffset: number;
	onRequestOpenPropertiesPanel: () => void;
}

interface NaturalSize {
	width: number;
	height: number;
}

interface Guide {
	orientation: 'vertical' | 'horizontal';
	position: number;
}

const WORKSPACE_MARGIN_MM = 100;
const LARGE_SCREEN_QUERY = '(min-width: 1280px)';
const LARGE_SCREEN_CANVAS_ZOOM = 1.25;

export function Canvas({ loadError, loadErrorActions, verticalCenterOffset, onRequestOpenPropertiesPanel }: CanvasProps) {
	const canvasRef = useRef<HTMLDivElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const hasInitialCentered = useRef(false);
	const lastCenteredZoom = useRef<number | null>(null);
	const isLargeScreen = useMediaQuery(LARGE_SCREEN_QUERY);
	const canvasZoom = isLargeScreen ? LARGE_SCREEN_CANVAS_ZOOM : 1;

	const [workspacePadding, setWorkspacePadding] = useState({
		horizontal: mmToPx(WORKSPACE_MARGIN_MM),
		vertical: mmToPx(WORKSPACE_MARGIN_MM),
	});

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
			? selectedElement.type === 'qr'
				? getQrSelectionCorners(selectedElement, naturalSizes[selectedElement.id], profile?.dpi ?? 203)
				: getSelectionCorners(getResizeBounds(selectedElement, naturalSizes[selectedElement.id]))
			: null;

	const handleResizePointerDown = useCallback(
		(handle: ResizeHandle, event: PointerEvent<HTMLDivElement>) => {
			event.stopPropagation();
			event.preventDefault();

			if (positionLocked) return;
			if (!selectedElement) return;

			const naturalSize = naturalSizes[selectedElement.id];
			if (!naturalSize) return;

			const bounds = getResizeBounds(selectedElement, naturalSize);

			beginHistoryTransaction();

			setResizeState({
				elementId: selectedElement.id,
				handle,
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

			const cursorX = pxToMm((event.clientX - canvasRect.left) / canvasZoom);
			const cursorY = pxToMm((event.clientY - canvasRect.top) / canvasZoom);

			const keepAspectRatio =
				element.type === 'barcode' || element.type === 'image'
					? element.lockAspectRatio
					: element.type === 'shape'
						? event.shiftKey
						: true;

			let minWidth: number | undefined;
			let minHeight: number | undefined;
			let maxWidth: number | undefined;
			let maxHeight: number | undefined;

			if (element.type === 'text') {
				const minScale = EDITOR_LIMITS.fontSizeMm.min / element.fontSize;

				const maxScale = EDITOR_LIMITS.fontSizeMm.max / element.fontSize;

				minWidth = resizeState.bounds.width * minScale;
				minHeight = resizeState.bounds.height * minScale;

				maxWidth = resizeState.bounds.width * maxScale;
				maxHeight = resizeState.bounds.height * maxScale;
			}

			if (element.type === 'qr') {
				minWidth = EDITOR_LIMITS.qrSizeMm.min;
				minHeight = EDITOR_LIMITS.qrSizeMm.min;

				maxWidth = EDITOR_LIMITS.qrSizeMm.max;
				maxHeight = EDITOR_LIMITS.qrSizeMm.max;
			}

			if (element.type === 'barcode') {
				minWidth = EDITOR_LIMITS.dimensionMm.min;
				minHeight = EDITOR_LIMITS.dimensionMm.min;

				maxWidth = EDITOR_LIMITS.dimensionMm.max;
				maxHeight = EDITOR_LIMITS.dimensionMm.max;
			}

			if (element.type === 'shape') {
				minWidth = 1;
				minHeight = 1;
				maxWidth = EDITOR_LIMITS.dimensionMm.max;
				maxHeight = EDITOR_LIMITS.dimensionMm.max;
			}

			const result = calculateResize({
				bounds: resizeState.bounds,
				handle: resizeState.handle,
				cursorX,
				cursorY,
				keepAspectRatio,
				minWidth,
				minHeight,
				maxWidth,
				maxHeight,
			});

			const resizedElement = applyResizeToElement(element, resizeState.bounds, result);

			updateElement(element.id, resizedElement);
		};

		window.addEventListener('pointermove', handlePointerMove);

		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
		};
	}, [resizeState, elements, updateElement, canvasZoom]);

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

	const handleCanvasPointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (event.target !== event.currentTarget) {
				return;
			}

			selectElement(null);
		},
		[selectElement],
	);

	useLayoutEffect(() => {
		if (!profile) return;

		const viewport = viewportRef.current;

		if (!viewport) return;

		const updateWorkspacePadding = () => {
			const canvasWidth = mmToPx(profile.widthMm);
			const canvasHeight = mmToPx(profile.heightMm);
			const zoomedCanvasWidth = canvasWidth * canvasZoom;
			const zoomedCanvasHeight = canvasHeight * canvasZoom;
			const margin = mmToPx(WORKSPACE_MARGIN_MM);

			setWorkspacePadding({
				horizontal: Math.max(margin, (viewport.clientWidth - zoomedCanvasWidth) / 2),
				vertical: Math.max(margin, (viewport.clientHeight - zoomedCanvasHeight) / 2),
			});
		};

		updateWorkspacePadding();

		const observer = new ResizeObserver(updateWorkspacePadding);
		observer.observe(viewport);

		return () => observer.disconnect();
	}, [profile, canvasZoom]);

	useLayoutEffect(() => {
		if (
			!profile ||
			(hasInitialCentered.current && lastCenteredZoom.current === canvasZoom)
		) {
			return;
		}

		const viewport = viewportRef.current;

		if (!viewport) return;

		const canvasWidth = mmToPx(profile.widthMm) * canvasZoom;
		const canvasHeight = mmToPx(profile.heightMm) * canvasZoom;
		const margin = mmToPx(WORKSPACE_MARGIN_MM);

		const horizontalPadding = Math.max(margin, (viewport.clientWidth - canvasWidth) / 2);
		const verticalPadding = Math.max(margin, (viewport.clientHeight - canvasHeight) / 2);

		requestAnimationFrame(() => {
			viewport.scrollLeft = horizontalPadding - (viewport.clientWidth - canvasWidth) / 2;
			viewport.scrollTop =
				verticalPadding - (viewport.clientHeight - canvasHeight) / 2 + verticalCenterOffset;

			hasInitialCentered.current = true;
			lastCenteredZoom.current = canvasZoom;
		});
	}, [profile, verticalCenterOffset, canvasZoom]);

	const handleViewportPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		const target = event.target as HTMLElement;

		if (target.closest('[data-canvas-element]') || target.closest('[data-selection-handle]')) {
			return;
		}

		selectElement(null);
	};

	if (loadError) {
		return (
			<div className='flex flex-1 items-center justify-center bg-app-bg p-8'>
				<ErrorState
					title='No se pudo abrir el editor'
					message={loadError}
					actions={loadErrorActions}
				/>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className='flex flex-1 items-center justify-center bg-app-bg p-8'>
				<LoadingState label='Cargando lienzo...' />
			</div>
		);
	}

	return (
		<div
			ref={viewportRef}
			onPointerDown={handleViewportPointerDown}
			className='min-h-0 min-w-0 flex-1 overflow-auto bg-app-bg thin-scrollbar'
		>
			<div
				className='relative w-max shrink-0'
				style={{
					paddingTop: workspacePadding.vertical,
					paddingBottom: workspacePadding.vertical,
					paddingLeft: workspacePadding.horizontal,
					paddingRight: workspacePadding.horizontal,
				}}
			>
				<div
					className='relative shrink-0'
					style={{
						width: mmToPx(profile.widthMm) * canvasZoom,
						height: mmToPx(profile.heightMm) * canvasZoom,
					}}
				>
					<div
						ref={canvasRef}
						data-canvas-element
						onPointerDown={handleCanvasPointerDown}
						style={{
							width: mmToPx(profile.widthMm),
							height: mmToPx(profile.heightMm),
							transform: `scale(${canvasZoom})`,
							transformOrigin: 'top left',
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
						className='relative overflow-visible border border-app-border bg-app-surface zebra-font-emulated'
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
								zoomScale={canvasZoom}
								onNaturalSizeChange={handleNaturalSizeChange}
								onDragPositionChange={handleDragPositionChange}
								onDragEnd={handleDragEnd}
								onRequestOpenPropertiesPanel={onRequestOpenPropertiesPanel}
							/>
						))}

						{selectedCorners && (
							<SelectionHandles
								corners={selectedCorners}
								onPointerDown={handleResizePointerDown}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
