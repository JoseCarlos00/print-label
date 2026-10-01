import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AdminBadge({ className }: { className?: string }) {
	return (
		<Badge
			variant='outline'
			className={cn('border-amber-700 text-amber-400', className)}
		>
			<ShieldCheck />
			Modo admin
		</Badge>
	);
}
