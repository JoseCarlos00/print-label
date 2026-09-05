import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EditorPage } from './pages/EditorPage';
import { LoginPage } from './pages/LoginPage';
import { StagingPage } from './pages/StagingPage';


function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>

					<Route path='/' element={<EditorPage />} />
					<Route path='/editor/:id' element={<EditorPage />} />
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
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
