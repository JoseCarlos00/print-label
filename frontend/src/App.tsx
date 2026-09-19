import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import { EditorRoute } from '@/pages/EditorPage';
import { LoginPage } from '@/pages/LoginPage';
import { StagingPage } from '@/pages/StagingPage';
import { GalleryPage } from '@/pages/GalleryPage';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useEditorKeyboard } from '@/hooks/useEditorKeyboard';

// El editor tiene su propia barra (TopBar: logo+dropdown, impresora,
// guardar/imprimir); mostrar además la NavBar global ahí duplicaría
// navegación. El resto de vistas (Galería, Login, Staging) sí la usan.
function isEditorPath(pathname: string): boolean {
	return pathname === '/' || pathname.startsWith('/editor/');
}

function AppShell() {
	const location = useLocation();
	const showNavBar = !isEditorPath(location.pathname);

	return (
		<div className='flex h-screen flex-col'>
			{showNavBar && <NavBar />}
			<div className='flex-1 overflow-hidden'>
				<Routes>
					<Route
						path='/'
						element={<EditorRoute />}
					/>
					<Route
						path='/editor/:id'
						element={<EditorRoute />}
					/>
					<Route
						path='/galeria'
						element={<GalleryPage />}
					/>
					<Route
						path='/login'
						element={<LoginPage />}
					/>

					<Route
						path='/staging'
						element={
							<ProtectedRoute>
								<StagingPage />
							</ProtectedRoute>
						}
					/>
				</Routes>
			</div>
		</div>
	);
}

function App() {
	useUnsavedChangesGuard();
	useEditorKeyboard();

	return (
		<AuthProvider>
			<BrowserRouter>
				<AppShell />
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
