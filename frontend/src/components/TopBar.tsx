import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FilePlus, LogIn, LogOut, Printer, BookImage, ClipboardClock } from 'lucide-react';

import type { PrinterProfile, Template } from 'shared';
import { api, ApiError } from '@/api/client';
import { useEditorStore } from '@/store/useEditorStore';
import type { EditorStore } from '@/store/editorStore.types';

import { useAuth } from '@/hooks/useAuth';
import { useNewDocument } from '@/hooks/useNewDocument';
import { useLoginDialog } from '@/hooks/useLoginDialog';

import { SaveTemplateModal } from './editor/SaveTemplateModal';
import { DocumentChip } from './editor/DocumentChip';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminBadge } from './AdminBadge'
import { PendingCount } from './PendingCount'
import { useLogout } from '@/hooks/useLogout'
import { usePendingCount } from '@/hooks/usePendingCount'

interface TopBarProps {
	profiles: PrinterProfile[];
	profilesError: string | null;
}

export function TopBar({ profiles, profilesError }: TopBarProps) {
	const { isAdmin } = useAuth();
	const navigate = useNavigate();

	const profile = useEditorStore((s) => s.profile);
	const setProfile = useEditorStore((s) => s.setProfile);
	const elements = useEditorStore((s) => s.elements);
	const templateId = useEditorStore((s) => s.templateId);
	const templateName = useEditorStore((s) => s.templateName);
	const loadedTemplateState = useEditorStore((s) => s.loadedTemplateState);

	const [printState, setPrintState] = useState<'idle' | 'printing'>('idle');
	const [isSaveModalOpen, setSaveModalOpen] = useState(false);

	const handleNewDocument = useNewDocument();

	const handlePrint = useCallback(async () => {
		if (!profile) return;

		setPrintState('printing');

		try {
			await api.post('/print', {
				elements,
				profileId: profile.id,
			});

			toast.add({ title: `Etiqueta enviada a ${profile.name}.`, type: 'success' });
		} catch (err) {
			toast.add({
				title: 'Error al imprimir',
				description: err instanceof ApiError ? err.message : undefined,
				type: 'error',
			});
		} finally {
			setPrintState('idle');
		}
	}, [profile, elements]);

	const handleSaved = (saved: Template, mode: 'created' | 'updated' | 'requested') => {
		const messages = {
			created: `Plantilla "${saved.name}" guardada.`,
			updated: `Plantilla "${saved.name}" actualizada.`,
			requested: `Solicitud enviada. Un admin debe aprobarla.`,
		};

		toast.add({
			title: messages[mode],
			type: mode === 'requested' ? 'info' : 'success',
		});

		if (mode === 'created') {
			navigate(`/editor/${saved.id}`, { replace: true });
		}
	};

	const isUpdating = isAdmin && Boolean(templateId) && loadedTemplateState === 'approved';

	const canEdit = Boolean(profile) && elements.length > 0;

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isPrintShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p';

			if (!isPrintShortcut) return;

			event.preventDefault();

			if (printState !== 'printing' && canEdit) {
				void handlePrint();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handlePrint, printState, canEdit]);

	return (
		<header className='flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-app-border p-2'>
			<div className='flex min-w-0 items-center gap-3'>
				<LogoMenu onNewDocument={handleNewDocument} />

				<DocumentChip
					templateId={templateId}
					templateName={templateName}
					onNewDocument={handleNewDocument}
				/>
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
					title='Imprimir (Ctrl+P)'
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

			{isSaveModalOpen && (
				<SaveTemplateModal
					onClose={() => setSaveModalOpen(false)}
					onSaved={handleSaved}
				/>
			)}
		</header>
	);
}

interface LogoMenuProps {
	onNewDocument: () => void;
}

function LogoMenu({ onNewDocument }: LogoMenuProps) {
	const { isAdmin } = useAuth();
	const { openLogin } = useLoginDialog();
	const navigate = useNavigate();
	const handleLogout = useLogout();
	const pending = usePendingCount(isAdmin);

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
					<DropdownMenuItem
						onClick={onNewDocument}
					>
						<FilePlus className='size-4' />
						Nueva etiqueta
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						onClick={() => navigate('/galeria')}
					>
						<BookImage className='size-4' />
						Galería
					</DropdownMenuItem>

					{isAdmin && (
						<DropdownMenuItem
							onClick={() => navigate('/staging')}
						>
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
						<DropdownMenuItem
							onClick={openLogin}
						>
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

interface PrinterSelectProps extends Pick<EditorStore, 'setProfile'> {
	profiles: PrinterProfile[];
	profile: PrinterProfile | null;
}

function PrinterSelect({ profiles, profile, setProfile }: PrinterSelectProps) {
	const handleChange = (profileId: string | null) => {
		const selectedProfile = profiles.find((item) => item.name === profileId);

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

			<SelectContent className='max-h-150'>
				{profiles.map((item) => (
					<SelectItem
						key={item.name}
						value={item.name}
					>
						<div className='flex min-w-0 flex-col'>
							<span className='truncate'>{item.name}</span>

							<span className='truncate text-[11px] text-app-text-muted'>{item.label}</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
