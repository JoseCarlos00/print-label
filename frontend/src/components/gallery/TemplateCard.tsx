import { Trash2 } from 'lucide-react';
import type { PrinterProfile, Template } from 'shared';

interface TemplateCardProps {
	template: Template;
	profile: PrinterProfile | undefined;
	onUse: () => void;
	onDelete?: () => void;
}

export function TemplateCard({ template, profile, onUse, onDelete }: TemplateCardProps) {
	return (
		<div className='flex flex-col justify-between rounded-md border border-app-border bg-app-surface p-4'>
			<div>
				<div className='flex items-start justify-between gap-2'>
					<p className='font-medium'>{template.name}</p>

					<div className='flex shrink-0 items-center gap-1'>
						<span
							className={`rounded px-2 py-0.5 text-xs ${
								template.public ? 'bg-app-accent/20 text-app-accent' : 'bg-app-border text-app-text-muted'
							}`}
						>
							{template.public ? 'Pública' : 'Privada'}
						</span>

						{onDelete && (
							<button
								type='button'
								onClick={onDelete}
								title='Eliminar plantilla'
								className='rounded p-1 text-app-text-muted hover:bg-red-950 hover:text-red-400 cursor-pointer'
							>
								<Trash2 className='size-3.5' />
							</button>
						)}
					</div>
				</div>
				<p className='mt-1 text-sm text-app-text-muted'>
					{profile ? `${profile.name} (${profile.widthMm}×${profile.heightMm}mm)` : 'Impresora no disponible'}
				</p>
				<p className='mt-1 text-xs text-app-text-muted'>{template.elements.length} elemento(s)</p>
				{template.positionLocked && <p className='mt-1 text-xs text-amber-400'>Posiciones bloqueadas</p>}
			</div>

			<button
				onClick={onUse}
				className='mt-4 rounded-md bg-app-accent-500 px-3 py-1.5 text-sm font-medium text-app-accent-contrast'
			>
				Usar esta plantilla
			</button>
		</div>
	);
}
