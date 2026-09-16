import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogIn, LogOut, Printer } from 'lucide-react';

import type { PrinterProfile, Template } from 'shared';

import { useAuth } from '@/context/AuthContext';
import { useEditorStore } from '@/store/useEditorStore';
import { api, ApiError } from '@/api/client';

import { SaveTemplateModal } from './SaveTemplateModal';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EditorStore } from '@/store/editorStore.types'

interface TopBarProps {
	profiles: PrinterProfile[];
	profilesError: string | null;
}

export function TopBar({ profiles, profilesError }: TopBarProps) {
	const { isAdmin } = useAuth();

	const profile = useEditorStore((s) => s.profile);
	const setProfile = useEditorStore((s) => s.setProfile);
	const elements = useEditorStore((s) => s.elements);
	const templateId = useEditorStore((s) => s.templateId);
	const templateName = useEditorStore((s) => s.templateName);
	const loadedTemplateState = useEditorStore((s) => s.loadedTemplateState);

	const [printState, setPrintState] = useState<'idle' | 'printing'>('idle');

	const [printError, setPrintError] = useState<string | null>(null);

	const [printSuccess, setPrintSuccess] = useState(false);

	const [isSaveModalOpen, setSaveModalOpen] = useState(false);

	const [saveMessage, setSaveMessage] = useState<string | null>(null);

	const handlePrint = async () => {
		if (!profile) return;

		setPrintState('printing');
		setPrintError(null);
		setPrintSuccess(false);

		try {
			await api.post('/print', {
				elements,
				profileId: profile.id,
			});

			setPrintSuccess(true);
		} catch (err) {
			setPrintError(err instanceof ApiError ? err.message : 'Error al imprimir');
		} finally {
			setPrintState('idle');
		}
	};

	const handleSaved = (saved: Template, mode: 'created' | 'updated' | 'requested') => {
		const messages = {
			created: `Plantilla "${saved.name}" guardada.`,
			updated: `Plantilla "${saved.name}" actualizada.`,
			requested: `Solicitud enviada para "${saved.name}". Un admin debe aprobarla.`,
		};

		setSaveMessage(messages[mode]);
	};

	const isUpdating = isAdmin && Boolean(templateId) && loadedTemplateState === 'approved';

	const canEdit = Boolean(profile) && elements.length > 0;

	return (
		<header className='flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-app-border p-2'>
			<div className='flex min-w-0 items-center gap-3'>
				<LogoMenu />

				<h1 className='truncate text-sm font-medium text-app-text-muted'>{templateName || 'Nueva etiqueta'}</h1>
			</div>

			<div className='flex items-center gap-2'>
				{profilesError ? (
					<p className='text-xs text-red-400'>{profilesError}</p>
				) : (
					<PrinterSelect
						profiles={profiles}
						profile={profile}
						setProfile={setProfile}
					/>
				)}

				<Button
					type='button'
					onClick={handlePrint}
					disabled={printState === 'printing' || !canEdit}
					className='bg-app-accent-500 text-app-accent-contrast hover:bg-app-accent-700'
				>
					<Printer />
					<span className='hidden sm:inline'>{printState === 'printing' ? 'Imprimiendo...' : 'Imprimir'}</span>
				</Button>

				<Button
					type='button'
					variant='outline'
					onClick={() => setSaveModalOpen(true)}
					disabled={!canEdit}
				>
					<span className='hidden sm:inline'>
						{isUpdating ? 'Actualizar plantilla' : isAdmin ? 'Guardar plantilla' : 'Solicitar plantilla'}
					</span>

					<span className='sm:hidden'>{isUpdating ? 'Actualizar' : isAdmin ? 'Guardar' : 'Solicitar'}</span>
				</Button>
			</div>

			{(printSuccess || printError || saveMessage) && (
				<div className='w-full text-xs'>
					{printSuccess && <p className='text-green-400'>Enviado a {profile?.name}.</p>}

					{printError && <p className='text-red-400'>{printError}</p>}

					{saveMessage && <p className='text-green-400'>{saveMessage}</p>}
				</div>
			)}

			{isSaveModalOpen && (
				<SaveTemplateModal
					onClose={() => setSaveModalOpen(false)}
					onSaved={handleSaved}
				/>
			)}
		</header>
	);
}

function LogoMenu() {
	const { isAdmin, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate('/');
	};

	return (
		<div className='flex items-center gap-2'>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant='ghost'
							size='sm'
							className='gap-1 px-2 text-sm font-semibold text-app-text'
						>
							PrintLabel
							<ChevronDown className='size-3.5 text-app-text-muted' />
						</Button>
					}
				/>

				<DropdownMenuContent align='start'>
					<DropdownMenuItem onClick={() => navigate('/galeria')}>Galería</DropdownMenuItem>

					{isAdmin && <DropdownMenuItem onClick={() => navigate('/staging')}>Staging</DropdownMenuItem>}

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
						<DropdownMenuItem onClick={() => navigate('/login')}>
							<LogIn />
							Login admin
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{isAdmin && (
				<Badge
					variant='outline'
					className='hidden border-amber-700 text-amber-400 sm:inline-flex'
				>
					Modo admin
				</Badge>
			)}
		</div>
	);
}

interface PrinterSelectProps extends Pick<EditorStore, 'setProfile'> {
	profiles: PrinterProfile[];
	profile: PrinterProfile | null;
}

function PrinterSelect({ profiles, profile, setProfile }: PrinterSelectProps) {
	const handleChange = (profileId: string | null) => {
		const selectedProfile = profiles.find((item) => item.id === profileId);

		setProfile(selectedProfile ?? null);
	};

	return (
		<Select
			value={profile?.name ?? ''}
			onValueChange={handleChange}
			disabled={profiles.length === 0}
		>
			<SelectTrigger className='w-36 sm:w-48'>
				<SelectValue placeholder='Seleccionar impresora' />
			</SelectTrigger>

			<SelectContent>
				{profiles.map((item) => (
					<SelectItem
						key={item.id}
						value={item.id}
					>
						<div className='flex min-w-0 flex-col'>
							<span className='truncate'>{item.name}</span>

							<span className='truncate text-[10px] text-app-text-muted'>{item.label}</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
