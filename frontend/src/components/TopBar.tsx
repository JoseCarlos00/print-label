import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, RotateCw } from 'lucide-react';

import type { PrinterProfile, Template } from 'shared';
import { api, ApiError } from '@/api/client';
import { useEditorStore } from '@/store/useEditorStore';

import { useAuth } from '@/hooks/useAuth';
import { useNewDocument } from '@/hooks/useNewDocument';

import { SaveTemplateModal } from './editor/SaveTemplateModal';
import { DocumentChip } from './editor/DocumentChip';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from '@/components/ui/toast';
import { PrinterSelect } from './top-bar/PrinterSelect'
import { LogoMenu } from './top-bar/LogoMenu'


interface TopBarProps {
	profiles: PrinterProfile[];
	profilesLoading: boolean;
	profilesError: string | null;
	onRetryProfiles: () => void;
}

export function TopBar({ profiles, profilesLoading, profilesError, onRetryProfiles }: TopBarProps) {
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
	const [isKeyboardPrintConfirmationOpen, setKeyboardPrintConfirmationOpen] = useState(false);

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
				setKeyboardPrintConfirmationOpen(true);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [printState, canEdit]);

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
					<div className='flex items-center gap-2'>
						<p className='text-xs text-red-400'>{profilesError}</p>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={onRetryProfiles}
						>
							<RotateCw />
							<span className='hidden sm:inline'>Reintentar</span>
						</Button>
					</div>
				) : (
					<PrinterSelect
						profiles={profiles}
						loading={profilesLoading}
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

			<ConfirmationDialog
				open={isKeyboardPrintConfirmationOpen}
				title='Confirmar impresión'
				description={`¿Enviar la etiqueta a  ${profile?.name ?? 'la impresora seleccionada'}?`}
				confirmLabel='Imprimir'
				busy={printState === 'printing'}
				onOpenChange={setKeyboardPrintConfirmationOpen}
				onConfirm={() => {
					setKeyboardPrintConfirmationOpen(false);
					// void handlePrint();
				}}
			/>
		</header>
	);
}
