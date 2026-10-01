import { Check, Eye, X } from 'lucide-react';
import type { PrinterProfile, Template } from 'shared';

import { Button } from '@/components/ui/button';
import { formatDate, formatLabelSize } from '@/utils/templateInfo';

interface StagingCardProps {
	template: Template;
	profile: PrinterProfile | undefined;
	approving: boolean;
	rejecting: boolean;
	onPreview: () => void;
	onApprove: () => void;
	onReject: () => void;
}

export function StagingCard({
	template,
	profile,
	approving,
	rejecting,
	onPreview,
	onApprove,
	onReject,
}: StagingCardProps) {
	const busy = approving || rejecting;

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
				<p className='mt-1 text-xs text-app-text-muted'>{formatDate(template.createOn)}</p>
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

			<div className='grid grid-cols-2 gap-2'>
				<Button
					type='button'
					variant='outline'
					disabled={busy}
					onClick={onReject}
				>
					<X />
					{rejecting ? 'Rechazando...' : 'Rechazar'}
				</Button>
				<Button
					type='button'
					disabled={busy}
					onClick={onApprove}
				>
					<Check />
					{approving ? 'Aprobando...' : 'Aprobar'}
				</Button>
			</div>
		</div>
	);
}
