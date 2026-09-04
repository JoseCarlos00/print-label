import { useEffect, useState } from 'react';
import type { Template } from 'shared';
import { api, ApiError } from '../api/client';

type ActionState = 'idle' | 'approving' | 'rejecting';

export function StagingPage() {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionState, setActionState] = useState<Record<string, ActionState>>({});

	const loadPending = () => {
		setLoading(true);
		setError(null);
		api
			.get<Template[]>('/staging')
			.then(setTemplates)
			.catch((err) => setError(err instanceof ApiError ? err.message : 'Error cargando plantillas pendientes'))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		loadPending();
	}, []);

	const handleAction = async (id: string, action: 'approved' | 'rejected') => {
		setActionState((prev) => ({ ...prev, [id]: action === 'approve' ? 'approving' : 'rejecting' }));

		try {
			await api.post(`/staging/${id}/${action}`);
			setTemplates((prev) => prev.filter((t) => t.id !== id));
		} catch (err) {
			setError(err instanceof ApiError ? err.message : `Error al ${action} la plantilla`);
			setActionState((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
		}
	};

	return (
		<div className='p-6'>
			<h1 className='text-3xl font-bold'>Panel de staging</h1>
			<p className='mt-1 text-sm text-app-text-muted'>
				Plantillas enviadas por usuarios libres, pendientes de revisión.
			</p>

			{error && <p className='mt-4 rounded-md border border-red-800 bg-red-950 p-3 text-sm text-red-300'>{error}</p>}

			{loading ? (
				<p className='mt-6 text-sm text-app-text-muted'>Cargando...</p>
			) : templates.length === 0 ? (
				<p className='mt-6 text-sm text-app-text-muted'>No hay plantillas pendientes de revisión.</p>
			) : (
				<ul className='mt-6 space-y-3'>
					{templates.map((template) => {
						const state = actionState[template.id] ?? 'idle';
						const isBusy = state !== 'idle';

						return (
							<li
								key={template.id}
								className='flex items-center justify-between rounded-md border border-app-border bg-app-surface p-4'
							>
								<div>
									<p className='font-medium'>{template.name}</p>
									<p className='text-sm text-app-text-muted'>Solicitado por: {template.byRequest || 'sin nombre'}</p>
								</div>
								<div className='flex gap-2'>
									<button
										disabled={isBusy}
										onClick={() => handleAction(template.id, 'approved')}
										className='rounded-md bg-app-accent px-3 py-1.5 text-sm font-medium text-app-accent-contrast disabled:opacity-50'
									>
										{state === 'approving' ? 'Aprobando...' : 'Aprobar'}
									</button>
									<button
										disabled={isBusy}
										onClick={() => handleAction(template.id, 'rejected')}
										className='rounded-md border border-app-border px-3 py-1.5 text-sm font-medium text-app-text disabled:opacity-50'
									>
										{state === 'rejecting' ? 'Rechazando...' : 'Rechazar'}
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
