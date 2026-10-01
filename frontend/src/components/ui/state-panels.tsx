import type { ReactNode } from 'react';
import { Loader2, RotateCw, TriangleAlert, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PanelProps {
	/** Versión pequeña para paneles laterales. */
	compact?: boolean;
	className?: string;
}

function panelClass(compact: boolean | undefined, className: string | undefined) {
	return cn(
		'flex flex-col items-center justify-center rounded-lg border border-dashed border-app-border text-center',
		compact ? 'gap-2 p-4' : 'gap-3 p-10',
		className,
	);
}

interface EmptyStateProps extends PanelProps {
	icon: LucideIcon;
	title: string;
	description?: string;
	action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, compact, className }: EmptyStateProps) {
	return (
		<div className={panelClass(compact, className)}>
			<Icon className={cn('text-app-text-muted', compact ? 'size-5' : 'size-8')} />
			<div className='space-y-1'>
				<p className={cn('font-medium text-app-text', compact ? 'text-sm' : 'text-base')}>{title}</p>
				{description && <p className='max-w-sm text-xs text-app-text-muted'>{description}</p>}
			</div>
			{action}
		</div>
	);
}

interface ErrorStateProps extends PanelProps {
	message: string;
	title?: string;
	onRetry?: () => void;
	/** Acciones extra (ej. "Ir a la galería"). */
	actions?: ReactNode;
}

export function ErrorState({
	message,
	title = 'Algo salió mal',
	onRetry,
	actions,
	compact,
	className,
}: ErrorStateProps) {
	return (
		<div
			role='alert'
			className={cn(panelClass(compact, className), 'border-red-900/60 bg-red-950/20')}
		>
			<TriangleAlert className={cn('text-red-400', compact ? 'size-5' : 'size-8')} />
			<div className='space-y-1'>
				<p className={cn('font-medium text-app-text', compact ? 'text-sm' : 'text-base')}>{title}</p>
				<p className='max-w-sm text-xs text-red-300'>{message}</p>
			</div>

			{(onRetry || actions) && (
				<div className='flex flex-wrap items-center justify-center gap-2'>
					{onRetry && (
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={onRetry}
						>
							<RotateCw />
							Reintentar
						</Button>
					)}
					{actions}
				</div>
			)}
		</div>
	);
}

export function LoadingState({ label = 'Cargando...', compact, className }: PanelProps & { label?: string }) {
	return (
		<div
			role='status'
			className={cn(
				'flex items-center justify-center gap-2 text-app-text-muted',
				compact ? 'p-4 text-xs' : 'p-10 text-sm',
				className,
			)}
		>
			<Loader2 className='size-4 animate-spin' />
			{label}
		</div>
	);
}
