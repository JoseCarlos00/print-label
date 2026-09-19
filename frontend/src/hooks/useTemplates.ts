import { useCallback, useEffect, useState } from 'react';
import type { Template } from 'shared';
import { api, ApiError } from '@/api/client';

interface UseTemplatesResult {
	templates: Template[];
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

export function useTemplates(includeNonPublic: boolean): UseTemplatesResult {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(() => {
		setLoading(true);
		setError(null);

		api
			.get<Template[]>(includeNonPublic ? '/templates/all' : '/templates')
			.then(setTemplates)
			.catch((err) => setError(err instanceof ApiError ? err.message : 'Error cargando plantillas'))
			.finally(() => setLoading(false));
	}, [includeNonPublic]);

	useEffect(() => {
		load();
	}, [load]);

	return { templates, loading, error, refetch: load };
}
