import { useEffect, useState } from 'react';

import type { Template } from 'shared';

import { api, ApiError } from '@/api/client';

interface UseTemplateResult {
	template: Template | null;
	loading: boolean;
	error: string | null;
}

export function useTemplate(id: string | undefined): UseTemplateResult {
	const [template, setTemplate] = useState<Template | null>(null);
	const [loading, setLoading] = useState(Boolean(id));
	const [error, setError] = useState<string | null>(null);

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
	}, [id]);

	return { template, loading, error };
}
