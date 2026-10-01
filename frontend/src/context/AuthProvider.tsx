import { useEffect, useState, type ReactNode } from 'react';
import { api, onUnauthorized } from '@/api/client';
import { toast } from '@/components/ui/toast';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get<{ isAdmin: boolean }>('/auth/me')
			.then((res) => setIsAdmin(res.isAdmin))
			.catch(() => setIsAdmin(false))
			.finally(() => setLoading(false));
	}, []);

	// La sesión dura 7 días: si el servidor responde 401 mientras la UI cree
	// que eres admin, la sesión venció.
	useEffect(() => {
		return onUnauthorized(() => {
			if (!isAdmin) return;

			setIsAdmin(false);
			toast.add({
				title: 'Tu sesión expiró',
				description: 'Inicia sesión de nuevo para continuar.',
				type: 'warning',
			});
		});
	}, [isAdmin]);

	const login = async (username: string, password: string) => {
		await api.post('/auth/login', { username, password });
		setIsAdmin(true);
	};

	const logout = async () => {
		await api.post('/auth/logout');
		setIsAdmin(false);
	};

	return <AuthContext.Provider value={{ isAdmin, loading, login, logout }}>{children}</AuthContext.Provider>;
}
