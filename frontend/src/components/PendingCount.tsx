import { Badge } from '@/components/ui/badge';

export function PendingCount({ count, className }: { count: number; className?: string }) {
	if (count <= 0) return null;

	return (
		<Badge
			variant='secondary'
			size='sm'
			className={`ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-app-accent-500 px-1 text-[10px] font-semibold text-app-accent-contrast ${className ?? ''}`}
			aria-label={`${count} solicitudes pendientes`}
		>
			{count > 99 ? '99+' : count}
		</Badge>
	);
}
