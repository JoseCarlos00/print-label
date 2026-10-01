import { ChevronDown, LogIn, LogOut } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useLoginDialog } from '@/hooks/useLoginDialog';
import { useLogout } from '@/hooks/useLogout';
import { AdminBadge } from '@/components/AdminBadge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminControls() {
	const { isAdmin } = useAuth();
	const { openLogin } = useLoginDialog();
	const handleLogout = useLogout();

	if (!isAdmin) {
		return (
			<Button
				type='button'
				variant='outline'
				size='sm'
				onClick={openLogin}
			>
				<LogIn />
				Iniciar sesión
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='gap-1 px-2'
					>
						<AdminBadge />
						<ChevronDown className='size-3.5 text-app-text-muted' />
					</Button>
				}
			/>

			<DropdownMenuContent align='end'>
				<DropdownMenuItem
					variant='destructive'
					onClick={handleLogout}
				>
					<LogOut />
					Cerrar sesión
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
