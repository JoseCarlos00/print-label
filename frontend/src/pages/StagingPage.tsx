import { useCallback, useEffect, useState } from 'react';
import { Check, PartyPopper, RotateCcw, Trash2, X } from 'lucide-react';
import type { Template } from 'shared';

import { api, ApiError } from '@/api/client';
import { usePrinterProfiles } from '@/hooks/usePrinterProfiles';
import { bumpTemplatesVersion } from '@/store/templatesCache';
import { StagingCard } from '@/components/staging/StagingCard';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-panels';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/utils/templateInfo';

type StagingTab = 'pending' | 'rejected';
type Action = 'approve' | 'reject' | 'restore' | 'delete';
type ActionState = 'idle' | Action;

export function StagingPage() {
	const [pendingTemplates, setPendingTemplates] = useState<Template[]>([]);
	const [rejectedTemplates, setRejectedTemplates] = useState<Template[]>([]);
	const [pendingLoading, setPendingLoading] = useState(true);
	const [rejectedLoading, setRejectedLoading] = useState(true);
	const [pendingError, setPendingError] = useState<string | null>(null);
	const [rejectedError, setRejectedError] = useState<string | null>(null);
	const [actionState, setActionState] = useState<Record<string, ActionState>>({});
	const [previewId, setPreviewId] = useState<string | null>(null);
	const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
	const [tab, setTab] = useState<StagingTab>('pending');

	const { profiles, error: profilesError, reload: reloadProfiles } = usePrinterProfiles();

	const loadPending = useCallback(async () => {
		try {
			const templates = await api.get<Template[]>('/staging');
			setPendingTemplates(templates);
			setPendingError(null);
		} catch (err) {
			setPendingError(err instanceof ApiError ? err.message : 'Error cargando plantillas pendientes');
		} finally {
			setPendingLoading(false);
		}
	}, []);

	const loadRejected = useCallback(async () => {
		try {
			const templates = await api.get<Template[]>('/staging/rejected');
			setRejectedTemplates(templates);
			setRejectedError(null);
		} catch (err) {
			setRejectedError(err instanceof ApiError ? err.message : 'Error cargando plantillas rechazadas');
		} finally {
			setRejectedLoading(false);
		}
	}, []);

	const reloadPending = useCallback(() => {
		setPendingLoading(true);
		setPendingError(null);
		return loadPending();
	}, [loadPending]);

	const reloadRejected = useCallback(() => {
		setRejectedLoading(true);
		setRejectedError(null);
		return loadRejected();
	}, [loadRejected]);

	useEffect(() => {
		loadPending();
		loadRejected();
	}, [loadPending, loadRejected]);


	const templates = tab === 'pending' ? pendingTemplates : rejectedTemplates;
	const loading = tab === 'pending' ? pendingLoading : rejectedLoading;
	const error = tab === 'pending' ? pendingError : rejectedError;

	const retry = tab === 'pending' ? reloadPending : reloadRejected;


	const performAction = async (template: Template, action: Action): Promise<boolean> => {
		setActionState((prev) => ({ ...prev, [template.id]: action }));

		try {
			let updatedTemplate: Template | null = null;

			if (action === 'delete') {
				await api.delete(`/staging/${template.id}`);
			} else {
				const path = action === 'restore' ? `/staging/${template.id}/restore` : `/staging/${template.id}/${action}`;
				updatedTemplate = await api.post<Template>(path);
			}

			const removeFromList = (items: Template[]) => items.filter((item) => item.id !== template.id);
			if (action === 'approve') {
				setPendingTemplates(removeFromList);
			} else if (action === 'reject') {
				setPendingTemplates(removeFromList);
				if (updatedTemplate) {
					const rejectedTemplate = updatedTemplate;
					setRejectedTemplates((items) =>
						[rejectedTemplate, ...removeFromList(items)].sort((a, b) => b.updateOn.localeCompare(a.updateOn)),
					);
				}
			} else if (action === 'restore') {
				setRejectedTemplates(removeFromList);
				if (updatedTemplate) {
					const restoredTemplate = updatedTemplate;
					setPendingTemplates((items) =>
						[...removeFromList(items), restoredTemplate].sort((a, b) => a.createOn.localeCompare(b.createOn)),
					);
				}
			} else {
				setRejectedTemplates(removeFromList);
			}
			bumpTemplatesVersion();
			setPreviewId((current) => (current === template.id ? null : current));
			setActionState((prev) => {
				const next = { ...prev };
				delete next[template.id];
				return next;
			});

			const successTitles: Record<Action, string> = {
				approve: 'Plantilla aprobada.',
				reject: 'Plantilla rechazada.',
				restore: 'Plantilla restaurada a pendientes.',
				delete: 'Plantilla eliminada definitivamente.',
			};
			toast.add({
				title: successTitles[action],
				type: 'success',
			});
			return true;
		} catch (err) {
			const actionLabels: Record<Action, string> = {
				approve: 'aprobar',
				reject: 'rechazar',
				restore: 'restaurar',
				delete: 'eliminar',
			};
			toast.add({
				title: `Error al ${actionLabels[action]} la plantilla`,
				description: err instanceof ApiError ? err.message : undefined,
				type: 'error',
			});
			setActionState((prev) => {
				const next = { ...prev };
				delete next[template.id];
				return next;
			});
			return false;
		}
	};

	const handleAction = (template: Template, action: Action) => {
		if (action === 'delete') {
			setTemplateToDelete(template);
			return;
		}

		void performAction(template, action);
	};

	const confirmDelete = async () => {
		if (!templateToDelete) return;
		const deleted = await performAction(templateToDelete, 'delete');
		if (deleted) setTemplateToDelete(null);
	};

	const previewTemplate = templates.find((t) => t.id === previewId) ?? null;
	const previewState = previewTemplate ? (actionState[previewTemplate.id] ?? 'idle') : 'idle';
	const previewBusy = previewState !== 'idle';

	return (
		<div className='h-full overflow-y-auto thin-scrollbar'>
			<div className='mx-auto max-w-6xl p-6'>
				<h1 className='text-3xl font-bold'>Panel de staging</h1>
				<p className='mt-1 text-sm text-app-text-muted'>
					{tab === 'pending'
						? 'Plantillas enviadas por usuarios libres, pendientes de revisión.'
						: 'Plantillas rechazadas que puedes restaurar o eliminar definitivamente.'}
				</p>

				<Tabs
					value={tab}
					onValueChange={(value) => {
						if (value === 'pending' || value === 'rejected') {
							setTab(value);
							setPreviewId(null);
						}
					}}
					className='mt-6'
				>
					<TabsList>
						<TabsTrigger
							className='
								h-full
								rounded-none
								border-0
								px-4
								text-app-text-muted
								transition-colors

								data-active:bg-app-surface!
    						data-active:text-app-accent-500!
							
								after:bottom-0
								after:h-0.5
								after:bg-app-accent-500
							'
							value='pending'
						>
							Pendientes
						</TabsTrigger>
						<TabsTrigger
							className='
								h-full
								rounded-none
								border-0
								px-4
								text-app-text-muted
								transition-colors

								data-active:bg-app-surface!
    						data-active:text-app-accent-500!
							
								after:bottom-0
								after:h-0.5
								after:bg-app-accent-500
							'
							value='rejected'
						>
							Rechazadas
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{profilesError && (
					<ErrorState
						compact
						className='mt-4'
						title='No se pudo cargar la información de impresoras'
						message='Las tarjetas no mostrarán el tamaño de etiqueta y la vista previa no estará disponible.'
						onRetry={reloadProfiles}
					/>
				)}

				{error && (
					<ErrorState
						className='mt-6'
						title={`No se pudieron cargar las ${tab === 'pending' ? 'solicitudes' : 'plantillas rechazadas'}`}
						message={error}
						onRetry={retry}
					/>
				)}

				{loading ? (
					<LoadingState
						className='mt-6'
						label={`Cargando ${tab === 'pending' ? 'solicitudes' : 'plantillas rechazadas'}...`}
					/>
				) : (
					templates.length === 0 &&
					!error && (
						<EmptyState
							className='mt-6'
							icon={tab === 'pending' ? PartyPopper : Trash2}
							title={tab === 'pending' ? 'Todo al día' : 'No hay rechazadas'}
							description={
								tab === 'pending'
									? 'No hay plantillas pendientes de revisión.'
									: 'No hay plantillas rechazadas por administrar.'
							}
						/>
					)
				)}

				{!loading && templates.length > 0 && (
					<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{templates.map((template) => {
							const state = actionState[template.id] ?? 'idle';

							return (
								<StagingCard
									key={template.id}
									template={template}
									profile={profiles.find((p) => p.id === template.profileId)}
									mode={tab}
									actionState={state}
									onPreview={() => setPreviewId(template.id)}
									onAction={(action) => handleAction(template, action)}
								/>
							);
						})}
					</div>
				)}
			</div>

			{previewTemplate && (
				<TemplatePreviewModal
					template={previewTemplate}
					profile={profiles.find((p) => p.id === previewTemplate.profileId)}
					subtitle={
						<>
							<span className='block'>Solicitado por: {previewTemplate.requestedBy || 'sin nombre'}</span>
							{tab === 'rejected' && (
								<span className='block'>Rechazada el: {formatDate(previewTemplate.updateOn)}</span>
							)}
						</>
					}
					onClose={() => setPreviewId(null)}
					footer={
						tab === 'pending' ? (
							<>
								<Button
									type='button'
									variant='outline'
									disabled={previewBusy}
									onClick={() => handleAction(previewTemplate, 'reject')}
								>
									<X />
									{previewState === 'reject' ? 'Rechazando...' : 'Rechazar'}
								</Button>
								<Button
									type='button'
									disabled={previewBusy}
									onClick={() => handleAction(previewTemplate, 'approve')}
								>
									<Check />
									{previewState === 'approve' ? 'Aprobando...' : 'Aprobar'}
								</Button>
							</>
						) : (
							<>
								<Button
									type='button'
									variant='outline'
									disabled={previewBusy}
									onClick={() => handleAction(previewTemplate, 'restore')}
								>
									<RotateCcw />
									{previewState === 'restore' ? 'Restaurando...' : 'Restaurar'}
								</Button>
								<Button
									type='button'
									variant='destructive'
									disabled={previewBusy}
									onClick={() => handleAction(previewTemplate, 'delete')}
								>
									<Trash2 />
									{previewState === 'delete' ? 'Eliminando...' : 'Eliminar'}
								</Button>
							</>
						)
					}
				/>
			)}

			<ConfirmationDialog
				open={templateToDelete !== null}
				title='Eliminar plantilla rechazada'
				description={`¿Eliminar definitivamente "${templateToDelete?.name ?? ''}"? \nEsta acción no se puede deshacer.`}
				confirmLabel='Eliminar'
				confirmVariant='destructive'
				busy={templateToDelete ? actionState[templateToDelete.id] === 'delete' : false}
				onOpenChange={(open) => {
					if (!open) setTemplateToDelete(null);
				}}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
