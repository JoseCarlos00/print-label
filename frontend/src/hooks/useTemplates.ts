import { useEffect, useState } from 'react';
import type { Template } from 'shared';
import { api, ApiError } from '../api/client';

interface UseTemplatesResult {
	templates: Template[];
	loading: boolean;
	error: string | null;
}

// includeNonPublic solo tiene efecto real si el usuario es admin — para
// alguien sin sesión, /api/templates/all devuelve 401 igual, así que el
// toggle de la UI ya se encarga de no ofrecerlo a quien no puede usarlo.
export function useTemplates(includeNonPublic: boolean): UseTemplatesResult {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		setError(null);

		api
			.get<Template[]>(includeNonPublic ? '/templates/all' : '/templates')
			.then(setTemplates)
			.catch((err) => setError(err instanceof ApiError ? err.message : 'Error cargando plantillas'))
			.finally(() => setLoading(false));
	}, [includeNonPublic]);

	return { templates, loading, error };
}
