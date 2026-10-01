import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { usePrinterProfiles } from '@/hooks/usePrinterProfiles';
import { useTemplates } from '@/hooks/useTemplates';

import { TemplateCard } from '@/components/gallery/TemplateCard';
import { toast } from '@/components/ui/toast';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import { Button } from '@/components/ui/button';

import { api, ApiError } from '@/api/client';
import { bumpTemplatesVersion } from '@/store/templatesCache';

export function GalleryPage() {
	const { isAdmin } = useAuth();
	const navigate = useNavigate();

	const [showAll, setShowAll] = useState(true);
	const [previewId, setPreviewId] = useState<string | null>(null);

	const { profiles } = usePrinterProfiles();
	const { templates, loading, error } = useTemplates(isAdmin && showAll);

	const handleDelete = async (id: string, name: string) => {
		if (!window.confirm(`Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

		try {
			await api.delete(`/templates/${id}`);
			bumpTemplatesVersion();
			toast.add({ title: `Plantilla "${name}" eliminada.`, type: 'success' });
		} catch (err) {
			toast.add({
				title: 'Error al eliminar la plantilla',
				description: err instanceof ApiError ? err.message : undefined,
				type: 'error',
			});
		}
	};

	const previewTemplate = templates.find((t) => t.id === previewId) ?? null;

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
							onPreview={() => setPreviewId(template.id)}
							onDelete={isAdmin ? () => handleDelete(template.id, template.name) : undefined}
						/>
					))}
				</div>
			)}

			{previewTemplate && (
				<TemplatePreviewModal
					template={previewTemplate}
					profile={profiles.find((p) => p.id === previewTemplate.profileId)}
					onClose={() => setPreviewId(null)}
					footer={
						<>
							<Button
								type='button'
								variant='outline'
								onClick={() => setPreviewId(null)}
								className='cursor-pointer'
							>
								Cerrar
							</Button>
							<Button
								type='button'
								onClick={() => navigate(`/editor/${previewTemplate.id}`)}
								className='cursor-pointer bg-app-accent-500 text-app-accent-contrast hover:bg-app-accent-700'
							>
								Usar esta plantilla
							</Button>
						</>
					}
				/>
			)}
		</div>
	);
}
