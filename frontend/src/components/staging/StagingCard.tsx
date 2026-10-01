import { Check, Eye, RotateCcw, Trash2, X } from 'lucide-react';
import type { PrinterProfile, Template } from 'shared';

import { Button } from '@/components/ui/button';
import { formatDate, formatLabelSize } from '@/utils/templateInfo';

type StagingCardMode = 'pending' | 'rejected';

interface StagingCardProps {
	template: Template;
	profile: PrinterProfile | undefined;
	mode: StagingCardMode;
	actionState: 'idle' | 'approve' | 'reject' | 'restore' | 'delete';
	onPreview: () => void;
	onAction: (action: 'approve' | 'reject' | 'restore' | 'delete') => void;
}

export function StagingCard({
	template,
	profile,
	mode,
	actionState,
	onPreview,
	onAction,
}: StagingCardProps) {
	const busy = actionState !== 'idle';

	return (
		<div className='flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-4'>
			<div className='min-w-0'>
				<p
					className='truncate font-medium text-app-text'
					title={template.name}
				>
					{template.name}
				</p>
				<p className='mt-1 truncate text-sm text-app-text-muted'>
					Solicitado por: {template.requestedBy || 'sin nombre'}
				</p>
				<p className='mt-1 text-xs text-app-text-muted'>
					{mode === 'rejected' ? 'Rechazada el: ' : ''}
					{formatDate(mode === 'rejected' ? template.updateOn : template.createOn)}
				</p>
				<p className='mt-1 text-xs text-app-text-muted'>
					Etiqueta: {formatLabelSize(profile)} · {template.elements.length} elemento(s)
				</p>
			</div>

			<Button
				type='button'
				variant='outline'
				onClick={onPreview}
				className='w-full border-app-accent-500 text-app-accent-400 hover:text-app-accent-400'
			>
				<Eye />
				Vista previa
			</Button>

			{mode === 'pending' ? (
				<div className='grid grid-cols-2 gap-2'>
					<Button
						type='button'
						variant='outline'
						disabled={busy}
						onClick={() => onAction('reject')}
					>
						<X />
						{actionState === 'reject' ? 'Rechazando...' : 'Rechazar'}
					</Button>
					<Button
						type='button'
						disabled={busy}
						onClick={() => onAction('approve')}
					>
						<Check />
						{actionState === 'approve' ? 'Aprobando...' : 'Aprobar'}
					</Button>
				</div>
			) : (
				<div className='grid grid-cols-2 gap-2'>
					<Button
						type='button'
						variant='outline'
						disabled={busy}
						onClick={() => onAction('restore')}
					>
						<RotateCcw />
						{actionState === 'restore' ? 'Restaurando...' : 'Restaurar'}
					</Button>
					<Button
						type='button'
						variant='destructive'
						disabled={busy}
						onClick={() => onAction('delete')}
					>
						<Trash2 />
						{actionState === 'delete' ? 'Eliminando...' : 'Eliminar'}
					</Button>
				</div>
			)}
		</div>
	);
}
