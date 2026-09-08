import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavBar } from './components/NavBar';
import { EditorPage } from './pages/EditorPage';
import { LoginPage } from './pages/LoginPage';
import { StagingPage } from './pages/StagingPage';
import { GalleryPage } from './pages/GalleryPage';

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<div className='flex h-screen flex-col'>
					<NavBar />
					<div className='flex-1 overflow-hidden'>
						<Routes>
							<Route path='/' element={<EditorPage />} />
							<Route path='/editor/:id' element={<EditorPage />} />
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
