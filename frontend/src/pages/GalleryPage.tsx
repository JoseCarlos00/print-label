import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePrinterProfiles } from '@/hooks/usePrinterProfiles';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateCard } from '@/components/gallery/TemplateCard';
import { api, ApiError } from '@/api/client';
import { bumpTemplatesVersion } from '@/store/templatesCache';

export function GalleryPage() {
	const { isAdmin } = useAuth();
	const navigate = useNavigate();

	const [showAll, setShowAll] = useState(true);
	const { profiles } = usePrinterProfiles();
	const { templates, loading, error } = useTemplates(isAdmin && showAll);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const handleDelete = async (id: string, name: string) => {
		if (!window.confirm(`Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

		setDeleteError(null);
		try {
			await api.delete(`/templates/${id}`);
			bumpTemplatesVersion();
		} catch (err) {
			setDeleteError(err instanceof ApiError ? err.message : 'Error al eliminar la plantilla');
		}
	};

	return (
		<div className='h-full overflow-y-auto p-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h1 className='text-3xl font-bold'>Galería de plantillas</h1>
					<p className='mt-1 text-sm text-app-text-muted'>Elegí una plantilla para reutilizarla en el editor.</p>
				</div>

				{isAdmin && (
					<label className='flex items-center gap-2 text-sm text-app-text-muted'>
						<input
							type='checkbox'
							checked={showAll}
							onChange={(e) => setShowAll(e.target.checked)}
						/>
						Ver todas (incluye privadas)
					</label>
				)}
			</div>

			{error && <p className='mt-4 rounded-md border border-red-800 bg-red-950 p-3 text-sm text-red-300'>{error}</p>}
			{deleteError && (
				<p className='mt-4 rounded-md border border-red-800 bg-red-950 p-3 text-sm text-red-300'>{deleteError}</p>
			)}

			{loading ? (
				<p className='mt-6 text-sm text-app-text-muted'>Cargando...</p>
			) : templates.length === 0 ? (
				<p className='mt-6 text-sm text-app-text-muted'>No hay plantillas disponibles.</p>
			) : (
				<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{templates.map((template) => (
						<TemplateCard
							key={template.id}
							template={template}
							profile={profiles.find((p) => p.id === template.profileId)}
							onUse={() => navigate(`/editor/${template.id}`)}
							onDelete={isAdmin ? () => handleDelete(template.id, template.name) : undefined}
						/>
					))}
				</div>
			)}
		</div>
	);
}
