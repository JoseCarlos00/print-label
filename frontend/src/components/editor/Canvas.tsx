import { useCallback, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { CanvasElement } from './CanvasElement';
import { GuidesOverlay } from './GuidesOverlay';
import { mmToPx } from '@/utils/scale';
import { getAlignmentPoints, getElementBounds } from '@/utils/geometry/elementBounds';
import { findAlignmentMatches } from '@/utils/geometry/alignment';

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
	const [naturalSizes, setNaturalSizes] = useState<Record<string, NaturalSize>>({});
	const [guides, setGuides] = useState<Guide[]>([]);

	const profile = useEditorStore((s) => s.profile);
	const elements = useEditorStore((s) => s.elements);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const selectElement = useEditorStore((s) => s.selectElement);
	const updateElement = useEditorStore((s) => s.updateElement);

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

			updateElement(elementId, {
				x,
				y,
			});
		},
		[elements, naturalSizes, profile, updateElement],
	);

	const handleDragEnd = useCallback(() => {
		setGuides([]);
	}, []);

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
				onPointerDown={() => selectElement(null)}
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
			</div>
		</div>
	);
}
