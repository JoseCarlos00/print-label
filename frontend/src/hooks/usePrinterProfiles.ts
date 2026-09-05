import { useEffect, useState } from 'react';
import type { PrinterProfile } from 'shared';
import { api, ApiError } from '../api/client';

interface UsePrinterProfilesResult {
	profiles: PrinterProfile[];
	loading: boolean;
	error: string | null;
}

export function usePrinterProfiles(): UsePrinterProfilesResult {
	const [profiles, setProfiles] = useState<PrinterProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		api
			.get<PrinterProfile[]>('/printers')
			.then(setProfiles)
			.catch((err) => setError(err instanceof ApiError ? err.message : 'Error cargando impresoras'))
			.finally(() => setLoading(false));
	}, []);

	return { profiles, loading, error };
}
