import type { PointerEvent } from 'react';

import { mmToPx } from '@/utils/scale';
import type { SelectionCorners } from '@/utils/geometry/elementBounds';
import type { ResizeHandle } from '@/utils/geometry/resize';

interface SelectionHandlesProps {
	corners: SelectionCorners;
	onPointerDown: (handle: ResizeHandle, event: PointerEvent<HTMLDivElement>) => void;
}

interface Handle {
	handle: ResizeHandle;
	position: { x: number; y: number };
	cursor: string;
}

export function SelectionHandles({ corners, onPointerDown }: SelectionHandlesProps) {
	const handles: Handle[] = [
		{
			handle: 'topLeft',
			position: corners.topLeft,
			cursor: 'nwse-resize',
		},
		{
			handle: 'topRight',
			position: corners.topRight,
			cursor: 'nesw-resize',
		},
		{
			handle: 'bottomLeft',
			position: corners.bottomLeft,
			cursor: 'nesw-resize',
		},
		{
			handle: 'bottomRight',
			position: corners.bottomRight,
			cursor: 'nwse-resize',
		},
	];

	return (
		<>
			{handles.map(({ handle, position, cursor }) => (
				<div
					key={handle}
					onPointerDown={(event) => onPointerDown(handle, event)}
					className='absolute z-40 size-2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-app-accent-500 bg-app-bg'
					style={{
						left: mmToPx(position.x),
						top: mmToPx(position.y),
						cursor,
					}}
				/>
			))}
		</>
	);
}
