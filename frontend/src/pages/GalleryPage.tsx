import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutTemplate } from 'lucide-react';
import type { Template } from 'shared';

import { useAuth } from '@/hooks/useAuth';
import { usePrinterProfiles } from '@/hooks/usePrinterProfiles';
import { useTemplates } from '@/hooks/useTemplates';

import { TemplateCard } from '@/components/gallery/TemplateCard';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-panels';
import { toast } from '@/components/ui/toast';

import { api, ApiError } from '@/api/client';
import { bumpTemplatesVersion } from '@/store/templatesCache';

export function GalleryPage() {
	const { isAdmin } = useAuth();
	const navigate = useNavigate();

	const [showAll, setShowAll] = useState(true);
	const [previewId, setPreviewId] = useState<string | null>(null);
	const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
	const [deleting, setDeleting] = useState(false);

	const { profiles } = usePrinterProfiles();
	const { templates, loading, error, reload } = useTemplates(isAdmin && showAll);

	const handleDelete = async () => {
		if (!templateToDelete) return;
		setDeleting(true);

		try {
			await api.delete(`/templates/${templateToDelete.id}`);
			bumpTemplatesVersion();
			toast.add({ title: `Plantilla "${templateToDelete.name}" eliminada.`, type: 'success' });
			setTemplateToDelete(null);
		} catch (err) {
			toast.add({
				title: 'Error al eliminar la plantilla',
				description: err instanceof ApiError ? err.message : undefined,
				type: 'error',
			});
		} finally {
			setDeleting(false);
		}
	};

	const previewTemplate = templates.find((t) => t.id === previewId) ?? null;
	const previewIndex = previewTemplate ? templates.findIndex((template) => template.id === previewTemplate.id) : -1;
	
	const showPreviewNavigation = templates.length > 1 && previewIndex >= 0;
	const showPreviousPreview = useCallback(() => {
		if (!showPreviewNavigation) return;
		const previousIndex = (previewIndex - 1 + templates.length) % templates.length;
		setPreviewId(templates[previousIndex].id);
	}, [showPreviewNavigation, previewIndex, templates]);

	const showNextPreview = useCallback(() => {
		if (!showPreviewNavigation) return;
		const nextIndex = (previewIndex + 1) % templates.length;
		setPreviewId(templates[nextIndex].id);
	}, [showPreviewNavigation, previewIndex, templates]);

	const hiddenPrivate = isAdmin && !showAll;

	useEffect(() => {
		if (!previewTemplate || templateToDelete) return;

		const handlePreviewKeyDown = (event: KeyboardEvent) => {
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

			const target = event.target;
			if (
				target instanceof HTMLElement &&
				(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
			) {
				return;
			}

			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				showPreviousPreview();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				showNextPreview();
			}
		};

		window.addEventListener('keydown', handlePreviewKeyDown, true);
		return () => window.removeEventListener('keydown', handlePreviewKeyDown, true);
	}, [previewTemplate, templateToDelete, showPreviousPreview, showNextPreview]);

	return (
		<div className='h-full overflow-y-auto thin-scrollbar'>
			<div className='mx-auto max-w-6xl p-6'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h1 className='text-3xl font-bold'>Galería de plantillas</h1>
						<p className='mt-1 text-sm text-app-text-muted'>Elige una plantilla para reutilizarla en el editor.</p>
					</div>

					{isAdmin && (
						<label className='flex cursor-pointer items-center gap-2 text-sm text-app-text-muted'>
							<input
								type='checkbox'
								checked={showAll}
								onChange={(e) => setShowAll(e.target.checked)}
							/>
							Ver todas (incluye privadas)
						</label>
					)}
				</div>

				{error && (
					<ErrorState
						className='mt-6'
						title='No se pudieron cargar las plantillas'
						message={error}
						onRetry={reload}
					/>
				)}

				{loading ? (
					<LoadingState
						className='mt-6'
						label='Cargando plantillas...'
					/>
				) : templates.length === 0 ? (
					!error && (
						<EmptyState
							className='mt-6'
							icon={LayoutTemplate}
							title='No hay plantillas disponibles'
							description={
								hiddenPrivate
									? 'No hay plantillas públicas. Las privadas están ocultas.'
									: 'Cuando se guarde o se apruebe una plantilla, aparecerá aquí.'
							}
							action={
								hiddenPrivate ? (
									<Button
										type='button'
										variant='outline'
										size='sm'
										onClick={() => setShowAll(true)}
									>
										Ver todas
									</Button>
								) : (
									<Button
										type='button'
										variant='outline'
										size='sm'
										onClick={() => navigate('/')}
									>
										Ir al editor
									</Button>
								)
							}
						/>
					)
				) : (
					<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{templates.map((template) => (
							<TemplateCard
								key={template.id}
								template={template}
								profile={profiles.find((p) => p.id === template.profileId)}
								onUse={() => navigate(`/editor/${template.id}`)}
								onPreview={() => setPreviewId(template.id)}
								onDelete={isAdmin ? () => setTemplateToDelete(template) : undefined}
							/>
						))}
					</div>
				)}
			</div>

			{previewTemplate && (
				<TemplatePreviewModal
					template={previewTemplate}
					profile={profiles.find((p) => p.id === previewTemplate.profileId)}
					onClose={() => setPreviewId(null)}
					footer={
						<>
							{showPreviewNavigation && (
								<div className='mr-auto flex items-center gap-2'>
									<Button
										type='button'
										variant='outline'
										size='icon'
										aria-label='Plantilla anterior'
										title='Plantilla anterior'
										onClick={showPreviousPreview}
									>
										<ChevronLeft />
									</Button>
									<span className='min-w-12 text-center text-xs text-app-text-muted'>
										{previewIndex + 1} / {templates.length}
									</span>
									<Button
										type='button'
										variant='outline'
										size='icon'
										aria-label='Siguiente plantilla'
										title='Siguiente plantilla'
										onClick={showNextPreview}
									>
										<ChevronRight />
									</Button>
								</div>
							)}
							<Button
								type='button'
								variant='outline'
								onClick={() => setPreviewId(null)}
							>
								Cerrar
							</Button>
							<Button
								type='button'
								onClick={() => navigate(`/editor/${previewTemplate.id}`)}
							>
								Usar esta plantilla
							</Button>
						</>
					}
				/>
			)}

			<ConfirmationDialog
				open={templateToDelete !== null}
				title='Eliminar plantilla'
				description={`¿Eliminar "${templateToDelete?.name ?? ''}"? \nEsta acción no se puede deshacer.`}
				confirmLabel='Eliminar'
				confirmVariant='destructive'
				busy={deleting}
				onOpenChange={(open) => {
					if (!open) setTemplateToDelete(null);
				}}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
