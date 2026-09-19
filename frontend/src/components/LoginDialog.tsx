import { useEffect, useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/api/client';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LoginDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
	const { login } = useAuth();

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!open) {
			setUsername('');
			setPassword('');
			setError(null);
		}
	}, [open]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		setError(null);
		setIsLoading(true);

		try {
			await login(username, password);
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className='sm:max-w-sm'>
				<DialogHeader>
					<DialogTitle>Iniciar sesión</DialogTitle>
					<DialogDescription>Inicia sesión para acceder a las funciones de administrador.</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className='space-y-4'
				>
					<div className='space-y-2'>
						<Label htmlFor='login-username'>Usuario</Label>
						<Input
							id='login-username'
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							autoComplete='username'
							disabled={isLoading}
							autoFocus
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='login-password'>Contraseña</Label>
						<Input
							id='login-password'
							type='password'
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete='current-password'
							disabled={isLoading}
						/>
					</div>

					{error && (
						<p
							className='text-sm text-red-400'
							role='alert'
						>
							{error}
						</p>
					)}

					<DialogFooter>
						<Button
							type='submit'
							disabled={isLoading || !username || !password}
							className='bg-app-accent-500 text-app-accent-contrast hover:bg-app-accent-700'
						>
							{isLoading ? (
								<>
									<Loader2 className='animate-spin' />
									Iniciando...
								</>
							) : (
								<>
									<LogIn />
									Iniciar sesión
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
