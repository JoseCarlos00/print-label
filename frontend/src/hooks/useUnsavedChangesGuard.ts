import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

/**
 * Registra el diálogo nativo del navegador al cerrar/recargar la pestaña
 * mientras haya cambios sin guardar. Se monta UNA sola vez en App.tsx —
 * separado de confirmLeaveEditor(), que cubre la navegación DENTRO de la
 * app (esto solo cubre cerrar/recargar).
 */
export function useUnsavedChangesGuard() {
	const isDirty = useEditorStore((s) => s.isDirty);

	useEffect(() => {
		if (!isDirty) return;

		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = ''; // algunos navegadores lo requieren para mostrar el diálogo
		};

		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [isDirty]);
}
