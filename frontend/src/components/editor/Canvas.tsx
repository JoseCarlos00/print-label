import { useEditorStore } from '@/store/useEditorStore';
import { CanvasElement } from './CanvasElement';
import { mmToPx } from '@/utils/scale';

interface CanvasProps {
	loadError?: string | null;
}

export function Canvas({ loadError }: CanvasProps) {
	const profile = useEditorStore((s) => s.profile);
	const elements = useEditorStore((s) => s.elements);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const selectElement = useEditorStore((s) => s.selectElement);

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
						linear-gradient(to right, rgba(120,120,120,.2) 1px, transparent 1px),
						linear-gradient(to bottom, rgba(120,120,120,.2) 1px, transparent 1px)`,
					backgroundSize: '12px 12px',
				}}
				className='relative border border-app-border bg-app-surface zebra-font-emulated'
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
