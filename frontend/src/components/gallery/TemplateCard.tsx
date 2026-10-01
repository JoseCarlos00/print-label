import { Eye, Trash2 } from 'lucide-react';
import type { PrinterProfile, Template } from 'shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatLabelSize } from '@/utils/templateInfo';

interface TemplateCardProps {
	template: Template;
	profile: PrinterProfile | undefined;
	onUse: () => void;
	onPreview: () => void;
	onDelete?: () => void;
}

export function TemplateCard({ template, profile, onUse, onPreview, onDelete }: TemplateCardProps) {
	return (
		<div className='flex flex-col justify-between gap-4 rounded-lg border border-app-border bg-app-surface p-4'>
			<div className='min-w-0'>
				<div className='flex items-start justify-between gap-2'>
					<p
						className='truncate font-medium'
						title={template.name}
					>
						{template.name}
					</p>

					<div className='flex shrink-0 items-center gap-1'>
						<Badge variant={template.public ? 'default' : 'secondary'}>
							{template.public ? 'Pública' : 'Privada'}
						</Badge>

						{onDelete && (
							<button
								type='button'
								onClick={onDelete}
								title='Eliminar plantilla'
								className='cursor-pointer rounded p-1 text-app-text-muted hover:bg-red-950 hover:text-red-400'
							>
								<Trash2 className='size-3.5' />
							</button>
						)}
					</div>
				</div>

				<p className='mt-1 text-sm text-app-text-muted'>Etiqueta: {formatLabelSize(profile)}</p>
				<p className='mt-1 text-xs text-app-text-muted'>
					{template.elements.length} elemento(s) · Actualizada {formatDate(template.updateOn)}
				</p>
				{template.positionLocked && <p className='mt-1 text-xs text-amber-400'>Posiciones bloqueadas</p>}
			</div>

			<div className='grid grid-cols-2 gap-2'>
				<Button
					type='button'
					variant='outline'
					onClick={onPreview}
					className='cursor-pointer'
				>
					<Eye />
					Vista previa
				</Button>
				<Button
					type='button'
					onClick={onUse}
					className='cursor-pointer bg-app-accent-500 text-app-accent-contrast hover:bg-app-accent-700'
				>
					Usar
				</Button>
			</div>
		</div>
	);
}
