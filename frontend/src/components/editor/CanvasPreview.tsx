import { useEditorStore } from '../../store/useEditorStore';
import { mmToPx } from '../../utils/scale';
import { useLabelPreview } from '../../hooks/useLabelPreview';


export function CanvasPreview() {
	const profile = useEditorStore((s) => s.profile);
	const elements = useEditorStore((s) => s.elements);

	const { imageUrl, loading, error, isStale, redraw } = useLabelPreview(elements, profile);

	if (!profile) return null;

	return (
		<div className='flex min-w-0 flex-1 flex-col items-center justify-center gap-2 overflow-auto bg-app-bg p-8'>
			<div className='flex items-center gap-2'>
				<p className='text-xs font-medium uppercase text-app-text-muted'>Vista previa real (Labelary)</p>
				<button
					onClick={redraw}
					disabled={loading || elements.length === 0}
					className='rounded-md border border-app-border px-2 py-1 text-xs text-app-text hover:bg-app-surface disabled:opacity-50'
				>
					{loading ? 'Generando...' : 'Redraw'}
				</button>
				{isStale && !loading && <span className='text-xs text-amber-400'>Hay cambios sin reflejar</span>}
			</div>

			<div
				style={{ width: mmToPx(profile.widthMm), height: mmToPx(profile.heightMm) }}
				className='relative flex items-center justify-center border border-app-border bg-white'
			>
				{!imageUrl && !loading && !error && (
					<p className='px-4 text-center text-sm text-app-text-muted'>Presioná "Redraw" para generar la vista previa</p>
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
