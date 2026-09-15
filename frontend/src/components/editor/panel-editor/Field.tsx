import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from 'cn';

interface FieldProps {
	label: string;
	disabled?: boolean;
	children: ReactNode;
}

export function Field({ label, disabled = false, children }: FieldProps) {
	return (
		<div className={cn('space-y-1', disabled && 'opacity-55')}>
			<Label className='text-xs font-normal text-app-text-muted'>{label}</Label>
			{children}
		</div>
	);
}
