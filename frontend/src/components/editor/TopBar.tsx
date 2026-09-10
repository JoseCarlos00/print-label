import { useEffect, useRef, useState } from 'react';
import type { PrinterProfile, Template } from 'shared';
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
			const res = await api.post('/print', {
				elements,
				profileId: profile.id,
			});

			console.log(res)

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
		<div className='flex flex-wrap items-center justify-between gap-2 border-b border-app-border p-2'>
			<h1 className='text-lg font-semibold'>{templateName || 'Nueva etiqueta'}</h1>

			<div className='flex items-center gap-2'>
				<label className='flex items-center gap-2 text-sm text-app-text-muted'>
					<PrinterSelect
						profiles={profiles}
						profile={profile}
						setProfile={setProfile}
					/>
				</label>

				<button
					onClick={handlePrint}
					disabled={printState === 'printing' || !profile || elements.length === 0}
					className='rounded-md bg-app-accent-500 px-3 py-1.5 text-sm font-medium text-app-accent-contrast disabled:opacity-50 active:bg-app-accent-700 hover:bg-app-accent-700  cursor-pointer'
				>
					{printState === 'printing' ? 'Imprimiendo...' : 'Imprimir'}
				</button>

				<button
					onClick={() => setSaveModalOpen(true)}
					disabled={!profile || elements.length === 0}
					className='rounded-md border border-app-border px-3 py-1.5 text-sm font-medium text-app-text disabled:opacity-50 cursor-pointer hover:bg-app-surface'
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

interface PrinterSelectProps {
	profiles: PrinterProfile[];
	profile: PrinterProfile | null;
	setProfile: (profile: PrinterProfile) => void;
}

function PrinterSelect({ profiles, profile, setProfile }: PrinterSelectProps) {
	const [open, setOpen] = useState(false);

		const containerRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			const handleClickOutside = (e: MouseEvent) => {
				if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
					setOpen(false);
				}
			};

			document.addEventListener('mousedown', handleClickOutside);

			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}, []);

	return (
		<div
			ref={containerRef}
			className='relative'
		>
			<button
				type='button'
				onClick={() => setOpen((value) => !value)}
				className='flex min-w-48 items-center justify-between gap-1 rounded-md border border-app-border bg-app-surface px-2 py-1 text-left text-app-text cursor-pointer'
			>
				<div className='min-w-0'>
					<div className='truncate text-sm'>{profile?.name ?? 'Seleccionar impresora'}</div>

					{profile?.ip && <div className='text-[10px] text-app-text-muted'>{profile.label}</div>}
				</div>

				<span className='text-xs text-app-text-muted'>
					<svg
						className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
						xmlns='http://www.w3.org/2000/svg'
						viewBox='0 0 320 512'
					>
						<path
							fill='currentColor'
							d='M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z'
						/>
					</svg>
				</span>
			</button>

			<div
				className={`
				absolute left-0 top-full z-50 mt-1 max-h-120 w-full
				overflow-y-auto thin-scrollbar rounded-md border border-app-border 
				bg-app-surface shadow-lg
				transition-[opacity,transform,visibility]
				duration-200 ease-out
				${open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0 pointer-events-none'}
			`}
			>
				{profiles.map((p) => (
					<button
						key={p.id}
						type='button'
						onClick={() => {
							setProfile(p);
							setOpen(false);
						}}
						className='w-full px-3 py-2 text-left hover:bg-app-border cursor-pointer'
					>
						<div className='text-sm text-app-text'>{p.name}</div>

						<div className='text-[10px] text-app-text-muted'>{p.label}</div>
					</button>
				))}
			</div>
		</div>
	);
}
