import { useEffect, useState } from 'react';
import type { PrinterProfile } from 'shared';
import { api, ApiError } from '@/api/client';

interface UsePrinterProfilesResult {
	profiles: PrinterProfile[];
	loading: boolean;
	error: string | null;
	reload: () => void;
}

export function usePrinterProfiles(): UsePrinterProfilesResult {
	const [profiles, setProfiles] = useState<PrinterProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		api
			.get<PrinterProfile[]>('/printers')
			.then(setProfiles)
			.catch((err) => setError(err instanceof ApiError ? err.message : 'Error cargando impresoras'))
			.finally(() => setLoading(false));
	}, [attempt]);

	const reload = () => {
		setError(null);
		setLoading(true);
		setAttempt((current) => current + 1);
	};

	return { profiles, loading, error, reload };
}
