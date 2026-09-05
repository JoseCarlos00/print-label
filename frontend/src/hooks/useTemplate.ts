import { useEffect, useState } from 'react';
import type { Template } from 'shared';
import { api, ApiError } from '../api/client';

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
		if (!id) {
			setTemplate(null);
			setLoading(false);
			setError(null);
			return;
		}

		setLoading(true);
		setError(null);

		api
			.get<Template>(`/templates/${id}`)
			.then(setTemplate)
			.catch((err) => setError(err instanceof ApiError ? err.message : 'Error cargando la plantilla'))
			.finally(() => setLoading(false));
	}, [id]);

	return { template, loading, error };
}
