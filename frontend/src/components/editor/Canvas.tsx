import { useEditorStore } from '../../store/useEditorStore';
import { CanvasElement } from './CanvasElement';
import { mmToPx } from '../../utils/scale';

export function Canvas() {
	const profile = useEditorStore((s) => s.profile);
	const elements = useEditorStore((s) => s.elements);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const selectElement = useEditorStore((s) => s.selectElement);
	const resetEditor = useEditorStore((s) => s.resetEditor);


	if (!profile) return null;

	return (
		<div className='flex min-w-0 flex-1 flex-col items-center justify-center bg-app-bg p-8 overflow-auto thin-scrollbar'>
			<div
				onPointerDown={() => selectElement(null)}
				style={{ width: mmToPx(profile.widthMm), height: mmToPx(profile.heightMm) }}
				className='relative border border-app-border bg-gray-300 zebra-font-emulated'
			>
				<div className='flex items-center gap-2 absolute -top-10 left-0'>
					<button
						onClick={resetEditor}
						disabled={elements.length === 0}
						className='rounded-md border border-app-border bg-app-accent-500 px-2 py-1.5 text-xs text-app-accent-contrast active:bg-app-accent-700 hover:bg-app-accent-700 font-medium disabled:opacity-50 cursor-pointer'
					>
						<svg
							className='size-4 inline m-0 mr-1 -mt-0.5 rotate-260'
							xmlns='http://www.w3.org/2000/svg'
							viewBox='0 0 512 512'
						>
							<path
								fill='currentColor'
								d='M386.3 160L336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z'
							/>
						</svg>
						Reiniciar
					</button>
				</div>
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
