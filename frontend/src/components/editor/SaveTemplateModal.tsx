import { useState, type FormEvent } from 'react';
import { Barcode, Image as ImageIcon, Loader2, QrCode, Square, Type, type LucideIcon } from 'lucide-react';
import type { CreateTemplateInput, LabelElement, Template, UpdateTemplateInput } from 'shared';

import { useAuth } from '@/hooks/useAuth';
import { useEditorStore } from '@/store/useEditorStore';
import { api, ApiError } from '@/api/client';
import { markHistorySaved } from '@/store/history';
import { bumpTemplatesVersion } from '@/store/templatesCache';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const NAME_MAX_LENGTH = 60;

type SaveMode = 'created' | 'updated' | 'requested';

interface SaveTemplateModalProps {
	onClose: () => void;
	onSaved: (template: Template, mode: SaveMode) => void;
}

const SHAPE_LABELS = { rectangle: 'Rectángulo', line: 'Línea', ellipse: 'Elipse' } as const;

function describeElement(el: LabelElement): { icon: LucideIcon; label: string } {
	switch (el.type) {
		case 'text':
			return { icon: Type, label: el.content.trim() || 'Texto' };
		case 'barcode':
			return { icon: Barcode, label: `Código de barras: ${el.content}` };
		case 'qr':
			return { icon: QrCode, label: `QR: ${el.content}` };
		case 'image':
			return { icon: ImageIcon, label: 'Imagen' };
		case 'shape':
			return { icon: Square, label: SHAPE_LABELS[el.shape] };
	}
}

interface OptionRowProps {
	id: string;
	label: string;
	description: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
}

function OptionRow({ id, label, description, checked, onCheckedChange, disabled }: OptionRowProps) {
	return (
		<div className='flex items-start justify-between gap-4'>
			<div className='min-w-0 space-y-1'>
				<Label
					htmlFor={id}
					className='cursor-pointer'
				>
					{label}
				</Label>
				<p className='text-xs text-app-text-muted'>{description}</p>
			</div>
			<Switch
				id={id}
				checked={checked}
				disabled={disabled}
				onCheckedChange={onCheckedChange}
				className='mt-0.5'
			/>
		</div>
	);
}

export function SaveTemplateModal({ onClose, onSaved }: SaveTemplateModalProps) {
	const { isAdmin } = useAuth();

	const templateId = useEditorStore((s) => s.templateId);
	const elements = useEditorStore((s) => s.elements);
	const profile = useEditorStore((s) => s.profile);
	const templateName = useEditorStore((s) => s.templateName);
	const isPublic = useEditorStore((s) => s.isPublic);
	const positionLockedStore = useEditorStore((s) => s.positionLocked);
	const loadedTemplateState = useEditorStore((s) => s.loadedTemplateState);
	const setTemplateMeta = useEditorStore((s) => s.setTemplateMeta);
	const toggleElementLock = useEditorStore((s) => s.toggleElementLock);

	// Solo se sobrescribe si eres admin Y la plantilla cargada ya está
	// aprobada (mismo criterio que TopBar). En cualquier otro caso se crea una nueva.
	const isUpdating = isAdmin && Boolean(templateId) && loadedTemplateState === 'approved';

	const [name, setName] = useState(templateName);
	const [isPub, setIsPub] = useState(isPublic);
	const [isLocked, setIsLocked] = useState(positionLockedStore);
	const [requestedBy, setRequestedBy] = useState('');
	const [attempted, setAttempted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const nameError = attempted && !name.trim() ? 'Escribe un nombre para la plantilla.' : null;
	const requestedByError =
		attempted && !isAdmin && !requestedBy.trim() ? 'Escribe tu nombre para identificar la solicitud.' : null;

	const submit = async (mode: 'update' | 'create') => {
		setAttempted(true);
		setError(null);

		if (!profile || elements.length === 0) return;
		if (!name.trim() || (!isAdmin && !requestedBy.trim())) return;

		setSubmitting(true);

		try {
			let saved: Template;
			let savedMode: SaveMode;

			const base = {
				name: name.trim(),
				profileId: profile.id,
				elements,
				// Solo el admin puede crear plantillas privadas.
				public: isAdmin ? isPub : true,
				positionLocked: isLocked,
			};

			if (isAdmin && mode === 'update' && templateId) {
				const body: UpdateTemplateInput = base;
				saved = await api.put<Template>(`/templates/${templateId}`, body);
				savedMode = 'updated';
			} else if (isAdmin) {
				const body: CreateTemplateInput = base;
				saved = await api.post<Template>('/templates', body);
				savedMode = 'created';
			} else {
				const body: CreateTemplateInput = { ...base, requestedBy: requestedBy.trim() };
				saved = await api.post<Template>('/templates/staging', body);
				savedMode = 'requested';
			}

			// el lienzo sigue siendo un documento nuevo.
			if (savedMode !== 'requested') {
				setTemplateMeta({
					templateId: saved.id,
					templateName: saved.name,
					isPublic: saved.public,
					positionLocked: saved.positionLocked,
					loadedTemplateState: saved.state,
				});
			}

			markHistorySaved();
			bumpTemplatesVersion();
			onSaved(saved, savedMode);
			onClose();
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Error al guardar la plantilla');
		} finally {
			setSubmitting(false);
		}
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitting) return;
		void submit(isUpdating ? 'update' : 'create');
	};

	const title = isUpdating ? 'Actualizar plantilla' : isAdmin ? 'Guardar plantilla' : 'Solicitar plantilla';
	const description = isUpdating
		? 'Los cambios sobrescribirán la plantilla actual.'
		: isAdmin
			? 'La plantilla se guardará directamente como aprobada.'
			: 'Un administrador revisará tu solicitud antes de que aparezca en la galería.';
	const submitLabel = isUpdating ? 'Actualizar' : isAdmin ? 'Guardar' : 'Enviar solicitud';
	const submittingLabel = isUpdating ? 'Actualizando...' : 'Guardando...';

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				// No se puede cerrar mientras se guarda.
				if (!open && !submitting) onClose();
			}}
		>
			<DialogContent
				className='sm:max-w-md'
				showCloseButton={!submitting}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className='space-y-4'
					noValidate
				>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label htmlFor='template-name'>Nombre de la plantilla</Label>
							<span className='text-xs text-app-text-muted'>
								{name.length} / {NAME_MAX_LENGTH}
							</span>
						</div>
						<Input
							id='template-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={NAME_MAX_LENGTH}
							disabled={submitting}
							aria-invalid={nameError ? true : undefined}
							autoFocus
						/>
						{nameError && (
							<p
								className='text-xs text-red-400'
								role='alert'
							>
								{nameError}
							</p>
						)}
					</div>

					{!isAdmin && (
						<div className='space-y-2'>
							<Label htmlFor='template-requested-by'>Tu nombre</Label>
							<Input
								id='template-requested-by'
								value={requestedBy}
								onChange={(e) => setRequestedBy(e.target.value)}
								maxLength={NAME_MAX_LENGTH}
								disabled={submitting}
								aria-invalid={requestedByError ? true : undefined}
								autoComplete='name'
							/>
							{requestedByError && (
								<p
									className='text-xs text-red-400'
									role='alert'
								>
									{requestedByError}
								</p>
							)}
						</div>
					)}

					{isAdmin && (
						<OptionRow
							id='template-public'
							label='Pública'
							description='Visible en la galería para todos. Si la desactivas, solo los administradores la verán.'
							checked={isPub}
							onCheckedChange={setIsPub}
							disabled={submitting}
						/>
					)}

					<OptionRow
						id='template-position-locked'
						label='Bloquear posiciones'
						description='Quien la reutilice solo podrá editar el contenido; no podrá mover elementos ni cambiar su formato.'
						checked={isLocked}
						onCheckedChange={setIsLocked}
						disabled={submitting}
					/>

					{isLocked && (
						<div className='space-y-2 rounded-lg border border-app-border p-3'>
							<div>
								<p className='text-xs font-medium uppercase text-app-text-muted'>Contenido fijo</p>
								<p className='mt-1 text-xs text-app-text-muted'>
									Los elementos activados no se podrán editar en absoluto, ni siquiera su contenido.
								</p>
							</div>

							<ul className='thin-scrollbar max-h-48 space-y-1 overflow-y-auto overflow-x-hidden pr-1'>
								{elements.map((el) => {
									const { icon: Icon, label } = describeElement(el);
									const switchId = `lock-element-${el.id}`;

									return (
										<li
											key={el.id}
											className='flex items-center justify-between gap-3 rounded-md px-1 py-1.5'
										>
											<Label
												htmlFor={switchId}
												className='min-w-0 flex-1 cursor-pointer font-normal'
											>
												<Icon className='size-4 shrink-0 text-app-text-muted' />
												<span
													className='truncate'
													title={label}
												>
													{label}
												</span>
											</Label>
											<Switch
												id={switchId}
												size='sm'
												checked={Boolean(el.locked)}
												disabled={submitting}
												onCheckedChange={() => toggleElementLock(el.id)}
											/>
										</li>
									);
								})}
							</ul>
						</div>
					)}

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
							type='button'
							variant='outline'
							disabled={submitting}
							onClick={onClose}
							className='cursor-pointer'
						>
							Cancelar
						</Button>

						{isUpdating && (
							<Button
								type='button'
								variant='secondary'
								disabled={submitting}
								onClick={() => void submit('create')}
								className='cursor-pointer'
							>
								Guardar como nueva
							</Button>
						)}

						<Button
							type='submit'
							disabled={submitting}
							className='cursor-pointer bg-app-accent-500 text-app-accent-contrast hover:bg-app-accent-700'
						>
							{submitting ? (
								<>
									<Loader2 className='animate-spin' />
									{submittingLabel}
								</>
							) : (
								submitLabel
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
