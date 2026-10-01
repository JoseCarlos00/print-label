const BASE_URL = '/api';

export class ApiError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

// Permite que la capa de auth (React) se entere de un 401 sin que el cliente HTTP dependa de React.
type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
	unauthorizedListeners.add(listener);

	return () => {
		unauthorizedListeners.delete(listener);
	};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { 'Content-Type': 'application/json' },
		...options,
	});

	const body = await res.json().catch(() => null);

	if (!res.ok) {
		// Un 401 en login son credenciales incorrectas, no una sesión vencida.
		if (res.status === 401 && path !== '/auth/login') {
			unauthorizedListeners.forEach((listener) => listener());
		}

		throw new ApiError(res.status, body?.message ?? 'Error inesperado del servidor');
	}

	return body as T;
}

export const api = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, data?: unknown) =>
		request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
	put: <T>(path: string, data: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
	delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
