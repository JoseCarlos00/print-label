import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useLoginDialog } from '@/hooks/useLoginDialog';

export function ProtectedRoute({ children }: { children: ReactNode }) {
	const { isAdmin, loading } = useAuth();
	const { openLogin } = useLoginDialog();

	useEffect(() => {
		if (!loading && !isAdmin) openLogin();
	}, [loading, isAdmin, openLogin]);

	if (loading) {
		return (
			<div className='flex h-full items-center justify-center'>
				<Loader2 className='size-5 animate-spin text-app-text-muted' />
			</div>
		);
	}

	if (!isAdmin)
		return (
			<Navigate
				to='/'
				replace
			/>
		);

	return <>{children}</>;
}
