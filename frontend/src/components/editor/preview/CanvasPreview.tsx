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
						<PencilToSquare className='size-4 inline m-0 mr-1 -mt-0.5' />
						{loading ? 'Generando...' : 'Redibujar'}
					</button>
					{isStale && !loading && <span className='text-xs text-amber-400'>Hay cambios sin reflejar</span>}
				</div>

				{!imageUrl && !loading && !error && (
					<p className='px-4 text-center text-sm text-app-text-muted'>
						Presiona&ensp;
						<PencilToSquare className='size-5 inline-block' />
						&ensp;para generar la vista previa
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

function PencilToSquare(props: React.SVGProps<SVGSVGElement>) {
	return (
	<svg
		{...props}
		xmlns='http://www.w3.org/2000/svg'
		viewBox='0 0 512 512'
	>
		<path
			fill='currentColor'
			d='M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z'
		/>
	</svg>
	);
}
