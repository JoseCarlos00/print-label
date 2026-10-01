import { useEffect, useState } from 'react';

import type { Template } from 'shared';

import { api, ApiError } from '@/api/client';

interface UseTemplateResult {
	template: Template | null;
	loading: boolean;
	error: string | null;
	errorStatus: number | null;
	reload: () => void;
}

export function useTemplate(id: string | undefined): UseTemplateResult {
	const [template, setTemplate] = useState<Template | null>(null);
	const [loading, setLoading] = useState(Boolean(id));
	const [error, setError] = useState<string | null>(null);
	const [errorStatus, setErrorStatus] = useState<number | null>(null);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		if (!id) return;

		let cancelled = false;

		api
			.get<Template>(`/templates/${id}`)
			.then((data) => {
				if (!cancelled) {
					setTemplate(data);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setError(err instanceof ApiError ? err.message : 'Error cargando la plantilla');
					setErrorStatus(err instanceof ApiError ? err.status : null);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [id, attempt]);

	const reload = () => {
		setError(null);
		setErrorStatus(null);
		setLoading(true);
		setAttempt((current) => current + 1);
	};

	return { template, loading, error, errorStatus, reload };
}
