import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { useTemplatesVersion } from '@/store/templatesCache';

/** Cantidad de solicitudes pendientes. Solo consulta si `enabled` (admin). */
export function usePendingCount(enabled: boolean): number {
	const [count, setCount] = useState(0);
	const version = useTemplatesVersion();

	useEffect(() => {
		if (!enabled) return;

		let cancelled = false;

		const load = () => {
			api
				.get<{ count: number }>('/staging/count')
				.then((res) => {
					if (!cancelled) setCount(res.count);
				})
				.catch(() => {
					// Un contador que falla no debe molestar: se queda con el último valor.
				});
		};

		load();
		// Las solicitudes llegan desde otros equipos: se refresca al volver a la pestaña.
		window.addEventListener('focus', load);

		return () => {
			cancelled = true;
			window.removeEventListener('focus', load);
		};
	}, [enabled, version]);

	return enabled ? count : 0;
}
