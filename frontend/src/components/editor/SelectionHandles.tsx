import { mmToPx } from '@/utils/scale';
import type { SelectionCorners } from '@/utils/geometry/elementBounds';

interface SelectionHandlesProps {
	corners: SelectionCorners;
}

export function SelectionHandles({ corners }: SelectionHandlesProps) {
	const handles = [corners.topLeft, corners.topRight, corners.bottomLeft, corners.bottomRight];

	return (
		<>
			{handles.map((corner, index) => (
				<div
					key={index}
					className='pointer-events-none absolute z-40 size-2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-app-accent-500 bg-app-bg'
					style={{
						left: mmToPx(corner.x),
						top: mmToPx(corner.y),
					}}
				/>
			))}
		</>
	);
}
