import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/api/client';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get<{ isAdmin: boolean }>('/auth/me')
			.then((res) => setIsAdmin(res.isAdmin))
			.finally(() => setLoading(false));
	}, []);

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
