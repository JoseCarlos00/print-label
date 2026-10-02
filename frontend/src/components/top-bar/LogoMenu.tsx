import { useState } from 'react';
import { ChevronDown, FilePlus, LogIn, LogOut, BookImage, ClipboardClock } from 'lucide-react';
import { useLoginDialog } from '@/hooks/useLoginDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminBadge } from '@/components/AdminBadge';
import { PendingCount } from '@/components/PendingCount';
import { useLogout } from '@/hooks/useLogout';
import { usePendingCount } from '@/hooks/usePendingCount';
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@base-ui/react'

interface LogoMenuProps {
	onNewDocument: () => void;
}

export function LogoMenu({ onNewDocument }: LogoMenuProps) {
	const { isAdmin } = useAuth();
	const { openLogin } = useLoginDialog();
	const navigate = useNavigate();
	const handleLogout = useLogout();
	const pending = usePendingCount(isAdmin);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<div className='flex items-center gap-2'>
			<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
				<DropdownMenuTrigger
					render={
						<Button
							variant='ghost'
							size='sm'
							className='gap-1 px-2 text-sm font-semibold text-app-text z-30 cursor-pointer relative'
						>
							PrintLabel
							{!isMenuOpen && <PendingCount count={pending} className='absolute -top-2 right-4.5' />}
							<ChevronDown className='size-3.5 text-app-text-muted inline-block ml-0.5' />
						</Button>
					}
				/>

				<DropdownMenuContent align='start'>
					<DropdownMenuItem onClick={onNewDocument}>
						<FilePlus className='size-4' />
						Nueva etiqueta
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem onClick={() => navigate('/galeria')}>
						<BookImage className='size-4' />
						Galería
					</DropdownMenuItem>

					{isAdmin && (
						<DropdownMenuItem onClick={() => navigate('/staging')}>
							<ClipboardClock className='size-4' />
							Staging
							<PendingCount count={pending} />
						</DropdownMenuItem>
					)}

					<DropdownMenuSeparator />

					{isAdmin ? (
						<DropdownMenuItem
							variant='destructive'
							onClick={handleLogout}
						>
							<LogOut />
							Cerrar sesión
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem onClick={openLogin}>
							<LogIn />
							Iniciar sesión
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{isAdmin && <AdminBadge className='hidden sm:inline-flex' />}
		</div>
	);
}
