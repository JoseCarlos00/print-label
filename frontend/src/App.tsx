import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavBar } from './components/NavBar';
import { EditorRoute } from './pages/EditorPage';
import { LoginPage } from './pages/LoginPage';
import { StagingPage } from './pages/StagingPage';
import { GalleryPage } from './pages/GalleryPage';
import { useUnsavedChangesGuard } from './hooks/useUnsavedChangesGuard'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'

function App() {
	useUnsavedChangesGuard();
	useEditorKeyboard();

	return (
		<AuthProvider>
			<BrowserRouter>
				<div className='flex h-screen flex-col'>
					<NavBar />
					<div className='flex-1 overflow-hidden'>
						<Routes>
							<Route path='/' element={<EditorRoute />} />
							<Route path='/editor/:id' element={<EditorRoute />} />
							<Route path='/galeria' element={<GalleryPage />} />
							<Route path='/login' element={<LoginPage />} />
							
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
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
