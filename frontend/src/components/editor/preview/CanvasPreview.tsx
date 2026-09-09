import { useEditorStore } from '../../../store/useEditorStore';
import { mmToPx } from '../../../utils/scale';
import { useLabelPreview } from '../../../hooks/useLabelPreview';


export function CanvasPreview() {
	const profile = useEditorStore((s) => s.profile);
	const elements = useEditorStore((s) => s.elements);

	const { imageUrl, loading, error, isStale, redraw } = useLabelPreview(elements, profile);

	if (!profile) return null;

	return (
		<div className='flex min-w-0 flex-1 flex-col items-center justify-center gap-2 overflow-auto bg-app-bg p-8'>
			<div
				style={{ width: mmToPx(profile.widthMm), height: mmToPx(profile.heightMm) }}
				className='relative flex items-center justify-center border border-app-border bg-white'
			>
				<div className='flex items-center gap-2 absolute -top-10 left-0'>
					<button
						onClick={redraw}
						disabled={loading || elements.length === 0}
						className='rounded-md border border-app-border bg-app-accent-500 px-2 py-1.5 text-xs text-app-accent-contrast active:bg-app-accent-700 hover:bg-app-accent-700 font-medium disabled:opacity-50 cursor-pointer'
					>
						{loading ? 'Generando...' : 'Vista Previa'}
					</button>
					{isStale && !loading && <span className='text-xs text-amber-400'>Hay cambios sin reflejar</span>}
				</div>

				{!imageUrl && !loading && !error && (
					<p className='px-4 text-center text-sm text-app-text-muted'>
						Presiona "Vista Previa" para generar la vista previa
					</p>
				)}

				{imageUrl && (
					<img
						src={imageUrl}
						alt='Vista previa de la etiqueta'
						className={`h-full w-full object-contain transition-opacity ${isStale ? 'opacity-40' : ''}`}
					/>
				)}

				{loading && (
					<div className='absolute inset-0 flex items-center justify-center bg-app-bg/60'>
						<p className='text-xs text-app-text-muted'>Generando...</p>
					</div>
				)}

				{error && !loading && (
					<div className='absolute inset-0 flex items-center justify-center bg-app-bg/90 p-4'>
						<p className='text-center text-xs text-red-400'>{error}</p>
					</div>
				)}
			</div>
		</div>
	);
}
