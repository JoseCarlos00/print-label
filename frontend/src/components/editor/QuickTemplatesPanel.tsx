import { Link } from 'react-router-dom';
import { useTemplates } from '@/hooks/useTemplates';

const QUICK_LIMIT = 8;

export function QuickTemplatesPanel() {
	const { templates, loading, error } = useTemplates(false);

	return (
		<div className='flex flex-col gap-2 p-4'>
			<div className='flex items-center justify-between'>
				<p className='text-xs font-medium uppercase text-app-text-muted'>Plantillas</p>
				<Link
					to='/galeria'
					className='text-xs text-app-accent hover:underline'
				>
					Ver todas
				</Link>
			</div>

			{loading && <p className='text-xs text-app-text-muted'>Cargando...</p>}
			{error && <p className='text-xs text-red-400'>{error}</p>}
			{!loading && templates.length === 0 && (
				<p className='text-xs text-app-text-muted'>No hay plantillas públicas todavía.</p>
			)}

			{templates.slice(0, QUICK_LIMIT).map((t) => (
				<Link
					key={t.id}
					to={`/editor/${t.id}`}
					className='rounded-md border border-app-border px-3 py-2 text-left text-sm text-app-text hover:bg-app-surface'
				>
					{t.name}
				</Link>
			))}
		</div>
	);
}
