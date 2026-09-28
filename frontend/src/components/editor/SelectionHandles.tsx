import type { PointerEvent } from 'react';

import { mmToPx } from '@/utils/scale';
import type { SelectionCorners } from '@/utils/geometry/elementBounds';

interface SelectionHandlesProps {
	corners: SelectionCorners;
	onBottomRightPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}

export function SelectionHandles({ corners, onBottomRightPointerDown }: SelectionHandlesProps) {
	const handles = [
		{
			position: corners.topLeft,
			interactive: false,
		},
		{
			position: corners.topRight,
			interactive: false,
		},
		{
			position: corners.bottomLeft,
			interactive: false,
		},
		{
			position: corners.bottomRight,
			interactive: true,
		},
	];

	return (
		<>
			{handles.map((handle, index) => (
				<div
					key={index}
					onPointerDown={handle.interactive ? onBottomRightPointerDown : undefined}
					className={`absolute z-40 size-2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-app-accent-500 bg-app-bg ${
						handle.interactive ? 'cursor-se-resize' : 'pointer-events-none'
					}`}
					style={{
						left: mmToPx(handle.position.x),
						top: mmToPx(handle.position.y),
					}}
				/>
			))}
		</>
	);
}
