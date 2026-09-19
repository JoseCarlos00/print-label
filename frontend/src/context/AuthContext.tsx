import { createContext } from 'react';

export interface AuthContextValue {
	isAdmin: boolean;
	loading: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
