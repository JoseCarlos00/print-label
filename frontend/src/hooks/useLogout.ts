import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import { isProtectedPath } from '@/utils/routes';

export function useLogout() {
	const { logout } = useAuth();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	return async () => {
		// Se navega ANTES de cerrar sesión: si no, ProtectedRoute vería "sin sesión"
		// y abriría el login justo después de que el usuario cerró sesión a propósito.
		if (isProtectedPath(pathname)) {
			navigate('/', { replace: true });
		}

		try {
			await logout();
		} catch (err) {
			toast.add({
				title: 'No se pudo cerrar sesión',
				description: err instanceof ApiError ? err.message : undefined,
				type: 'error',
			});
		}
	};
}
