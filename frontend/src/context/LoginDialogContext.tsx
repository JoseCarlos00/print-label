import { createContext } from 'react';

interface LoginDialogContextValue {
	isOpen: boolean;
	openLogin: () => void;
	closeLogin: () => void;
}

export const LoginDialogContext = createContext<LoginDialogContextValue | null>(null);
