import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';

interface AuthContextValue {
	isAdmin: boolean;
	loading: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
	return ctx;
}
