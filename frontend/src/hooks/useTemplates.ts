import { useEffect, useState } from 'react';
import type { Template } from 'shared';
import { api, ApiError } from '@/api/client';
import { useTemplatesVersion } from '@/store/templatesCache';

interface UseTemplatesResult {
	templates: Template[];
	loading: boolean;
	error: string | null;
	reload: () => void;
}

export function useTemplates(includeNonPublic: boolean): UseTemplatesResult {
	const [templates, setTemplates] = useState<Template[]>([]);
	// Para qué modo (públicas / todas) son los datos que hay en `templates`.
	const [loadedFor, setLoadedFor] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);
	const version = useTemplatesVersion();

	useEffect(() => {
		let cancelled = false;

		api
			.get<Template[]>(includeNonPublic ? '/templates/all' : '/templates')
			.then((data) => {
				if (cancelled) return;
				setTemplates(data);
				setLoadedFor(includeNonPublic);
				setError(null);
			})
			.catch((err) => {
				if (cancelled) return;
				setError(err instanceof ApiError ? err.message : 'Error cargando plantillas');
			});

		return () => {
			cancelled = true;
		};
	}, [includeNonPublic, version, attempt]);

	const reload = () => {
		setError(null);
		setAttempt((current) => current + 1);
	};

	const isCurrent = loadedFor === includeNonPublic;

	return {
		// Nunca mostramos datos de otro modo mientras llegan los correctos.
		templates: isCurrent ? templates : [],
		loading: !isCurrent && error === null,
		error,
		reload,
	};
}
