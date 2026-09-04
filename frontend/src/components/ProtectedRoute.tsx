import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
	const { isAdmin, loading } = useAuth();

	if (loading) return null; // o un spinner si prefieres
	if (!isAdmin) return <Navigate to="/login" replace />;

	return <>{children}</>;
}
