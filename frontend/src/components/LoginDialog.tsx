import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';

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
	const [showPassword, setShowPassword] = useState(false);
	const [attempted, setAttempted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!open) {
			setUsername('');
			setPassword('');
			setShowPassword(false);
			setAttempted(false);
			setError(null);
		}
	}, [open]);

	const usernameError = attempted && !username.trim() ? 'Escribe tu usuario.' : null;
	const passwordError = attempted && !password ? 'Escribe tu contraseña.' : null;

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		setAttempted(true);
		setError(null);

		if (!username.trim() || !password) return;

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
			onOpenChange={(next) => {
				// No se puede cerrar mientras se envía.
				if (!next && isLoading) return;
				onOpenChange(next);
			}}
		>
			<DialogContent
				className='sm:max-w-sm'
				showCloseButton={!isLoading}
			>
				<DialogHeader>
					<DialogTitle>Iniciar sesión</DialogTitle>
					<DialogDescription>Inicia sesión para acceder a las funciones de administrador.</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className='space-y-4'
					noValidate
				>
					<div className='space-y-2'>
						<Label htmlFor='login-username'>Usuario</Label>
						<Input
							id='login-username'
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							autoComplete='username'
							disabled={isLoading}
							aria-invalid={usernameError ? true : undefined}
							autoFocus
						/>
						{usernameError && (
							<p
								className='text-xs text-red-400'
								role='alert'
							>
								{usernameError}
							</p>
						)}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='login-password'>Contraseña</Label>
						<div className='relative'>
							<Input
								id='login-password'
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								autoComplete='current-password'
								disabled={isLoading}
								aria-invalid={passwordError ? true : undefined}
								className='pr-9'
							/>
							<Button
								type='button'
								variant='ghost'
								size='icon-xs'
								onClick={() => setShowPassword((current) => !current)}
								disabled={isLoading}
								aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
								className='absolute top-1/2 right-1 -translate-y-1/2 text-app-text-muted'
							>
								{showPassword ? <EyeOff /> : <Eye />}
							</Button>
						</div>
						{passwordError && (
							<p
								className='text-xs text-red-400'
								role='alert'
							>
								{passwordError}
							</p>
						)}
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
							disabled={isLoading}
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
