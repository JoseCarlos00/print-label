import { useMemo } from 'react';
import { X } from 'lucide-react';
import type { PrinterProfile, Template } from 'shared';
import { StaticLabelPreview } from './StaticLabelPreview';

interface StagingPreviewModalProps {
	template: Template;
	profiles: PrinterProfile[];
	onClose: () => void;
	onApprove: () => void;
	onReject: () => void;
	busy: boolean;
}

export function StagingPreviewModal({
	template,
	profiles,
	onClose,
	onApprove,
	onReject,
	busy,
}: StagingPreviewModalProps) {
	const profile = useMemo(() => profiles.find((p) => p.id === template.profileId), [profiles, template.profileId]);

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
			<div className='flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-app-border bg-app-bg'>
				<div className='flex items-center justify-between border-b border-app-border p-4'>
					<div className='min-w-0'>
						<h2 className='truncate text-lg font-semibold text-app-text'>{template.name}</h2>
						<p className='text-xs text-app-text-muted'>Solicitado por: {template.requestedBy || 'sin nombre'}</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						aria-label='Cerrar'
						className='shrink-0 rounded-md p-1 text-app-text-muted hover:bg-app-surface cursor-pointer'
					>
						<X className='size-4' />
					</button>
				</div>

				{profile ? (
					<StaticLabelPreview
						template={template}
						profile={profile}
					/>
				) : (
					<div className='flex flex-1 items-center justify-center p-8'>
						<p className='text-sm text-red-400'>
							La impresora original de esta plantilla ya no está disponible, no se puede generar la vista previa.
						</p>
					</div>
				)}

				<div className='flex justify-end gap-2 border-t border-app-border p-3'>
					<button
						type='button'
						disabled={busy}
						onClick={onReject}
						className='rounded-md border border-app-border px-3 py-1.5 text-sm font-medium text-app-text disabled:opacity-50 cursor-pointer hover:bg-app-surface'
					>
						{busy ? 'Procesando...' : 'Rechazar'}
					</button>
					<button
						type='button'
						disabled={busy}
						onClick={onApprove}
						className='rounded-md bg-app-accent-500 px-3 py-1.5 text-sm font-medium text-app-accent-contrast disabled:opacity-50 cursor-pointer hover:bg-app-accent-700'
					>
						{busy ? 'Procesando...' : 'Aprobar'}
					</button>
				</div>
			</div>
		</div>
	);
}
