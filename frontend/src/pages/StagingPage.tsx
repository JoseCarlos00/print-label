import { useCallback, useEffect, useState } from 'react';
import { Check, PartyPopper, X } from 'lucide-react';
import type { Template } from 'shared';

import { api, ApiError } from '@/api/client';
import { usePrinterProfiles } from '@/hooks/usePrinterProfiles';
import { bumpTemplatesVersion } from '@/store/templatesCache';
import { StagingCard } from '@/components/staging/StagingCard';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-panels';
import { toast } from '@/components/ui/toast';

type ActionState = 'idle' | 'approving' | 'rejecting';

export function StagingPage() {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionState, setActionState] = useState<Record<string, ActionState>>({});
	const [previewId, setPreviewId] = useState<string | null>(null);

	const { profiles, error: profilesError, reload: reloadProfiles } = usePrinterProfiles();

	const fetchPending = useCallback(() => {
		api
			.get<Template[]>('/staging')
			.then(setTemplates)
			.catch((err) => setError(err instanceof ApiError ? err.message : 'Error cargando plantillas pendientes'))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchPending();
	}, [fetchPending]);

	const retry = () => {
		setError(null);
		setLoading(true);
		fetchPending();
	};

	const handleAction = async (id: string, action: 'approve' | 'reject') => {
		setActionState((prev) => ({ ...prev, [id]: action === 'approve' ? 'approving' : 'rejecting' }));

		try {
			await api.post(`/staging/${id}/${action}`);
			setTemplates((prev) => prev.filter((t) => t.id !== id));
			bumpTemplatesVersion();
			setPreviewId((current) => (current === id ? null : current));
			toast.add({
				title: action === 'approve' ? 'Plantilla aprobada.' : 'Plantilla rechazada.',
				type: 'success',
			});
		} catch (err) {
			toast.add({
				title: `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} la plantilla`,
				description: err instanceof ApiError ? err.message : undefined,
				type: 'error',
			});
			setActionState((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
		}
	};

	const previewTemplate = templates.find((t) => t.id === previewId) ?? null;
	const previewState = previewTemplate ? (actionState[previewTemplate.id] ?? 'idle') : 'idle';
	const previewBusy = previewState !== 'idle';

	return (
		<div className='h-full overflow-y-auto thin-scrollbar'>
			<div className='mx-auto max-w-6xl p-6'>
				<h1 className='text-3xl font-bold'>Panel de staging</h1>
				<p className='mt-1 text-sm text-app-text-muted'>
					Plantillas enviadas por usuarios libres, pendientes de revisión.
				</p>

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
						title='No se pudieron cargar las solicitudes'
						message={error}
						onRetry={retry}
					/>
				)}

				{loading ? (
					<LoadingState
						className='mt-6'
						label='Cargando solicitudes...'
					/>
				) : (
					templates.length === 0 &&
					!error && (
						<EmptyState
							className='mt-6'
							icon={PartyPopper}
							title='Todo al día'
							description='No hay plantillas pendientes de revisión.'
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
									approving={state === 'approving'}
									rejecting={state === 'rejecting'}
									onPreview={() => setPreviewId(template.id)}
									onApprove={() => handleAction(template.id, 'approve')}
									onReject={() => handleAction(template.id, 'reject')}
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
					subtitle={`Solicitado por: ${previewTemplate.requestedBy || 'sin nombre'}`}
					onClose={() => setPreviewId(null)}
					footer={
						<>
							<Button
								type='button'
								variant='outline'
								disabled={previewBusy}
								onClick={() => handleAction(previewTemplate.id, 'reject')}
							>
								<X />
								{previewState === 'rejecting' ? 'Rechazando...' : 'Rechazar'}
							</Button>
							<Button
								type='button'
								disabled={previewBusy}
								onClick={() => handleAction(previewTemplate.id, 'approve')}
							>
								<Check />
								{previewState === 'approving' ? 'Aprobando...' : 'Aprobar'}
							</Button>
						</>
					}
				/>
			)}
		</div>
	);
}
