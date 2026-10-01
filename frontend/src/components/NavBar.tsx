import { NavLink } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { usePendingCount } from '@/hooks/usePendingCount';
import { AdminControls } from '@/components/AdminControls';
import { PendingCount } from '@/components/PendingCount';
import { cn } from '@/lib/utils';

const linkClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
		isActive ? 'bg-app-surface text-app-text' : 'text-app-text-muted hover:text-app-text',
	);

export function NavBar() {
	const { isAdmin } = useAuth();
	const pending = usePendingCount(isAdmin);

	return (
		<nav className='flex h-14 shrink-0 items-center justify-between border-b border-app-border px-6'>
			<div className='flex items-center gap-4'>
				<span className='text-sm font-semibold text-app-text'>PrintLabel</span>

				<div className='flex items-center gap-1'>
					<NavLink
						to='/'
						end
						className={linkClass}
					>
						Editor
					</NavLink>

					<NavLink
						to='/galeria'
						className={linkClass}
					>
						Galería
					</NavLink>

					{isAdmin && (
						<NavLink
							to='/staging'
							className={linkClass}
						>
							Staging
							<PendingCount count={pending} />
						</NavLink>
					)}
				</div>
			</div>

			<AdminControls />
		</nav>
	);
}
