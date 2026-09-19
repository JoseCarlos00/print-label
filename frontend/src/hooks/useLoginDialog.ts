import { useContext } from 'react';

import { LoginDialogContext } from '@/context/LoginDialogContext';

export function useLoginDialog() {
	const context = useContext(LoginDialogContext);

	if (!context) {
		throw new Error('useLoginDialog debe usarse dentro de LoginDialogProvider');
	}

	return context;
}
