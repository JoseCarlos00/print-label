import type { ImageElement } from 'shared';
import { mmToPx } from '@/utils/scale';

export function ImagePreview({ element }: { element: ImageElement }) {
	return (
		<img
			src={element.src}
			alt=''
			draggable={false}
			style={{
				display: 'block',
				width: mmToPx(element.width),
				height: mmToPx(element.height),
			}}
		/>
	);
}
