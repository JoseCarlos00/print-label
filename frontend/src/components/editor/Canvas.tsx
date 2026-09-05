import { useEditorStore } from '../../store/useEditorStore';
import { CanvasElement } from './CanvasElement';
import { mmToPx } from '../../utils/scale';

export function Canvas() {
	const profile = useEditorStore((s) => s.profile);
	const elements = useEditorStore((s) => s.elements);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const selectElement = useEditorStore((s) => s.selectElement);

	if (!profile) return null;

	return (
		<div className='flex flex-1 items-center justify-center overflow-auto bg-app-bg p-8'>
			<div
				onPointerDown={() => selectElement(null)}
				style={{ width: mmToPx(profile.widthMm), height: mmToPx(profile.heightMm) }}
				className='relative border border-app-border bg-white'
			>
				{elements.map((el) => (
					<CanvasElement
						key={el.id}
						element={el}
						isSelected={el.id === selectedElementId}
						canvasWidthMm={profile.widthMm}
						canvasHeightMm={profile.heightMm}
					/>
				))}
			</div>
		</div>
	);
}
