import { NavLink } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { usePendingCount } from '@/hooks/usePendingCount';
import { AdminControls } from '@/components/AdminControls';
import { PendingCount } from '@/components/PendingCount';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

const linkClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		'flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors sm:px-3',
		isActive ? 'bg-app-surface text-app-text' : 'text-app-text-muted hover:text-app-text',
	);

export function NavBar() {
	const { isAdmin } = useAuth();
	const pending = usePendingCount(isAdmin);

	return (
		<nav className='flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-app-border px-2 sm:px-6'>
			<div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-4'>
				<Logo titleClassName='hidden lg:inline' />

				<div className='flex min-w-0 items-center gap-0.5 overflow-x-auto'>
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
