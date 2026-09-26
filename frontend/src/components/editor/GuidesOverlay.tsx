import { mmToPx } from '@/utils/scale';

export interface Guide {
	orientation: 'vertical' | 'horizontal';
	position: number;
}

interface GuidesOverlayProps {
	guides: Guide[];
	widthMm: number;
	heightMm: number;
}

export function GuidesOverlay({ guides, widthMm, heightMm }: GuidesOverlayProps) {
	return (
		<>
			{guides.map((guide, index) => {
				const isVertical = guide.orientation === 'vertical';

				return (
					<div
						key={`${guide.orientation}-${guide.position}-${index}`}
						className='pointer-events-none absolute z-30'
						style={
							isVertical
								? {
										left: mmToPx(guide.position),
										top: 0,
										width: 1,
										height: mmToPx(heightMm),
										backgroundColor: 'var(--color-app-accent-500)',
									}
								: {
										left: 0,
										top: mmToPx(guide.position),
										width: mmToPx(widthMm),
										height: 1,
										backgroundColor: 'var(--color-app-accent-500)',
									}
						}
					/>
				);
			})}
		</>
	);
}
