import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar() {
	const { isAdmin, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate('/');
	};

	return (
		<nav className='flex h-14 shrink-0 items-center justify-between border-b border-app-border px-6'>
			<div className='flex items-center gap-6'>
				<Link
					to='/'
					className='text-sm font-semibold text-app-text -rotate-12'
				>
					PrintLabel
				</Link>

				<Link
					to='/'
					className='text-sm text-app-text-muted hover:text-app-text'
				>
					Editor
				</Link>

				<Link
					to='/galeria'
					className='text-sm text-app-text-muted hover:text-app-text'
				>
					Galería
				</Link>
				
				{isAdmin && (
					<Link
						to='/staging'
						className='text-sm text-app-text-muted hover:text-app-text'
					>
						Staging
					</Link>
				)}
			</div>

			<div className='flex items-center gap-3'>
				{isAdmin && <span className='rounded bg-amber-800 px-2 py-0.5 text-xs text-white'>Modo admin</span>}
				{isAdmin ? (
					<button
						onClick={handleLogout}
						className='text-sm text-app-text-muted hover:text-app-text'
					>
						Cerrar sesión
					</button>
				) : (
					<Link
						to='/login'
						className='text-sm text-app-text-muted hover:text-app-text'
					>
						Login admin
					</Link>
				)}
			</div>
		</nav>
	);
}
