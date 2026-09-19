import { useEffect } from 'react';
import { useIsDirty } from '@/store/history';

export function useUnsavedChangesGuard() {
	const isDirty = useIsDirty();

	useEffect(() => {
		if (!isDirty) return;

		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};

		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [isDirty]);
}
