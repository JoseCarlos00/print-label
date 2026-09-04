const BASE_URL = '/api';

export class ApiError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { 'Content-Type': 'application/json' },
		...options,
	});

	const body = await res.json().catch(() => null);

	if (!res.ok) {
		throw new ApiError(res.status, body?.message ?? 'Error inesperado del servidor');
	}

	return body as T;
}

export const api = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, data?: unknown) =>
		request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
};
