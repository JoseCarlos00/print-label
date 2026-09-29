import { useEffect, useState } from 'react';
import type { Template } from 'shared';
import { api, ApiError } from '@/api/client';
import { useTemplatesVersion } from '@/store/templatesCache';

interface UseTemplatesResult {
	templates: Template[];
	loading: boolean;
	error: string | null;
}

export function useTemplates(includeNonPublic: boolean): UseTemplatesResult {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const version = useTemplatesVersion();

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const data = await api.get<Template[]>(includeNonPublic ? '/templates/all' : '/templates');

				if (!cancelled) {
					setTemplates(data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof ApiError ? err.message : 'Error cargando plantillas');
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void load();

		return () => {
			cancelled = true;
		};
	}, [includeNonPublic, version]);

	return { templates, loading, error };
}
