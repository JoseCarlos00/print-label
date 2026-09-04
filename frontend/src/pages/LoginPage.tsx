import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

export function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			await login(username, password);
			navigate('/staging');
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Error al iniciar sesión');
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='mx-auto mt-20 max-w-sm space-y-4 p-6'
		>
			<h1 className='text-2xl font-bold text-amber-900 dark:text-amber-100'>Login admin</h1>
			<input
				className='w-full rounded border p-2'
				placeholder='Usuario'
				value={username}
				onChange={(e) => setUsername(e.target.value)}
			/>
			<input
				className='w-full rounded border p-2'
				type='password'
				placeholder='Contraseña'
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>
			{error && <p className='text-red-600 text-sm'>{error}</p>}
			<button
				className='w-full rounded bg-amber-900 p-2 text-white'
				type='submit'
			>
				Entrar
			</button>
		</form>
	);
}
