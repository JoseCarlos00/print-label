import { useState } from 'react';
import type { PrinterProfile, Template } from 'shared';
import type { ZplTarget } from 'shared/zpl'
import { useAuth } from '../../context/AuthContext';
import { useEditorStore } from '../../store/useEditorStore';
import { api, ApiError } from '../../api/client';
import { SaveTemplateModal } from './SaveTemplateModal';

interface TopBarProps {
	profiles: PrinterProfile[];
}

export function TopBar({ profiles }: TopBarProps) {
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
			console.log(elements)
			const target: ZplTarget = 'print'

			const res = await api.post<{ message: string; zpl: string }>('/print', {
				elements,
				profileId: profile.id,
				target,
			});
			// * Debug
			console.log(res.zpl)
			
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

	return (
		<div className='flex flex-wrap items-center justify-between gap-3 border-b border-app-border p-4'>
			<h1 className='text-lg font-semibold'>{templateName || 'Nueva etiqueta'}</h1>

			<div className='flex items-center gap-3'>
				<label className='flex items-center gap-2 text-sm text-app-text-muted'>
					Imprimiendo a:
					<select
						className='rounded-md border border-app-border bg-app-surface p-1 text-app-text'
						value={profile?.id ?? ''}
						onChange={(e) => {
							const next = profiles.find((p) => p.id === e.target.value);
							if (next) setProfile(next);
						}}
					>
						{profiles.map((p) => (
							<option
								key={p.id}
								value={p.id}
							>
								{p.name} ({p.ip})
							</option>
						))}
					</select>
				</label>

				<button
					onClick={handlePrint}
					disabled={printState === 'printing' || !profile || elements.length === 0}
					className='rounded-md bg-app-accent px-3 py-1.5 text-sm font-medium text-app-accent-contrast disabled:opacity-50'
				>
					{printState === 'printing' ? 'Imprimiendo...' : 'Imprimir'}
				</button>

				<button
					onClick={() => setSaveModalOpen(true)}
					disabled={!profile || elements.length === 0}
					className='rounded-md border border-app-border px-3 py-1.5 text-sm font-medium text-app-text disabled:opacity-50'
				>
					{isUpdating ? 'Actualizar plantilla' : isAdmin ? 'Guardar plantilla' : 'Solicitar plantilla'}
				</button>
			</div>

			{printSuccess && <p className='w-full text-sm text-green-400'>Enviado a {profile?.name}.</p>}
			{printError && <p className='w-full text-sm text-red-400'>{printError}</p>}

			{saveMessage && <p className='w-full text-sm text-green-400'>{saveMessage}</p>}
			{isSaveModalOpen && (
				<SaveTemplateModal
					onClose={() => setSaveModalOpen(false)}
					onSaved={handleSaved}
				/>
			)}
		</div>
	);
}
