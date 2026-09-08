import { useState } from 'react';
import type { CreateTemplateInput, Template, UpdateTemplateInput } from 'shared';
import { useAuth } from '../../context/AuthContext';
import { useEditorStore } from '../../store/useEditorStore';
import { api, ApiError } from '../../api/client';

interface SaveTemplateModalProps {
	onClose: () => void;
	onSaved: (template: Template, mode: 'created' | 'updated' | 'requested') => void;
}

export function SaveTemplateModal({ onClose, onSaved }: SaveTemplateModalProps) {
	const { isAdmin } = useAuth();

	const templateId = useEditorStore((s) => s.templateId);
	const loadedTemplateState = useEditorStore((s) => s.loadedTemplateState);
	const elements = useEditorStore((s) => s.elements);
	const profile = useEditorStore((s) => s.profile);
	const templateName = useEditorStore((s) => s.templateName);
	const isPublic = useEditorStore((s) => s.isPublic);
	const positionLockedStore = useEditorStore((s) => s.positionLocked);
	const setTemplateMeta = useEditorStore((s) => s.setTemplateMeta);
	const toggleElementLock = useEditorStore((s) => s.toggleElementLock);

	// Actualizar (PUT) solo aplica si sos admin Y la plantilla cargada ya
	// es 'approved'. Cualquier otro caso (admin desde cero, admin con una
	// plantilla pending/rejected cargada, o cualquier usuario libre) crea
	// una plantilla nueva — nunca se sobrescribe nada sin ser admin+approved.
	const isUpdating = isAdmin && Boolean(templateId) //&& loadedTemplateState === 'approved';

	const [name, setName] = useState(templateName);
	const [isPub, setIsPub] = useState(isPublic);
	const [isLocked, setIsLocked] = useState(positionLockedStore);
	const [requestedBy, setRequestedBy] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	console.log({ loadedTemplateState, templateId, isUpdating });
	
	const canSubmit =
		name.trim().length > 0 && Boolean(profile) && elements.length > 0 && (isAdmin || requestedBy.trim().length > 0);

	const handleSubmit = async () => {
		if (!profile || !canSubmit) return;

		setSubmitting(true);
		setError(null);

		try {
			let saved: Template;
			let mode: 'created' | 'updated' | 'requested';

			if (isUpdating) {
				const body: UpdateTemplateInput = {
					name: name.trim(),
					profileId: profile.id,
					elements,
					public: isPub,
					positionLocked: isLocked,
				};

				saved = await api.put<Template>(`/templates/${templateId}`, body);

				mode = 'updated';
			} else if (isAdmin) {
				const body: CreateTemplateInput = {
					name: name.trim(),
					profileId: profile.id,
					elements,
					public: isPub,
					positionLocked: isLocked,
				};

				saved = await api.post<Template>('/templates', body);

				mode = 'created';
			} else {
				const body: CreateTemplateInput = {
					name: name.trim(),
					profileId: profile.id,
					elements,
					public: isPub,
					positionLocked: isLocked,
					requestedBy: requestedBy.trim(),
				};

				saved = await api.post<Template>('/templates/staging', body);

				mode = 'requested';
			}


			setTemplateMeta({ templateName: saved.name, isPublic: saved.public, positionLocked: saved.positionLocked });
			onSaved(saved, mode);
			onClose();
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Error al guardar la plantilla');
		} finally {
			setSubmitting(false);
		}
	};

	const titles = { updating: 'Actualizar plantilla', admin: 'Guardar plantilla', free: 'Solicitar plantilla' };
	const title = isUpdating ? titles.updating : isAdmin ? titles.admin : titles.free;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
			<div className='w-full max-w-md space-y-4 rounded-lg border border-app-border bg-app-bg p-6'>
				<h2 className='text-lg font-semibold'>{title}</h2>

				<label className='block text-sm text-app-text-muted'>
					Nombre
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-2 text-app-text'
					/>
				</label>

				<label className='flex items-center gap-2 text-sm text-app-text-muted'>
					<input
						type='checkbox'
						checked={isPub}
						onChange={(e) => setIsPub(e.target.checked)}
					/>
					Pública (visible en la galería general)
				</label>

				<label className='flex items-center gap-2 text-sm text-app-text-muted'>
					<input
						type='checkbox'
						checked={isLocked}
						onChange={(e) => setIsLocked(e.target.checked)}
					/>
					Bloquear posiciones (quien la reutilice solo podrá editar el contenido)
				</label>

				{isLocked && (
					<div className='space-y-1 rounded-md border border-app-border p-3'>
						<p className='text-xs font-medium uppercase text-app-text-muted'>
							Elementos completamente bloqueados (ni el contenido se podrá editar)
						</p>
						{elements.map((el) => (
							<label
								key={el.id}
								className='flex items-center gap-2 text-sm text-app-text'
							>
								<input
									type='checkbox'
									checked={Boolean(el.locked)}
									onChange={() => toggleElementLock(el.id)}
								/>
								{el.type === 'text'
									? el.content || 'Texto'
									: el.type === 'barcode'
										? `Barcode: ${el.content}`
										: 'Código QR'}
							</label>
						))}
					</div>
				)}

				{!isAdmin && (
					<label className='block text-sm text-app-text-muted'>
						Tu nombre (para identificar la solicitud)
						<input
							value={requestedBy}
							onChange={(e) => setRequestedBy(e.target.value)}
							className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-2 text-app-text'
						/>
					</label>
				)}

				{error && <p className='text-sm text-red-400'>{error}</p>}

				<div className='flex justify-end gap-2 pt-2'>
					<button
						onClick={onClose}
						className='rounded-md border border-app-border px-3 py-1.5 text-sm text-app-text'
					>
						Cancelar
					</button>
					<button
						disabled={!canSubmit || submitting}
						onClick={handleSubmit}
						className='rounded-md bg-app-accent px-3 py-1.5 text-sm font-medium text-app-accent-contrast disabled:opacity-50'
					>
						{submitting ? 'Guardando...' : isUpdating ? 'Actualizar' : isAdmin ? 'Guardar' : 'Enviar solicitud'}
					</button>
				</div>
			</div>
		</div>
	);
}
