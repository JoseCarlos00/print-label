import type { ReactNode } from 'react';

interface FieldProps {
	label: string;
	disabled?: boolean;
	children: ReactNode;
}

export function Field({ label, disabled = false, children }: FieldProps) {
	return (
		<label
			className={[
				'block text-xs text-app-text-muted',
				disabled && 'opacity-55',
			]
				.filter(Boolean)
				.join(' ')}
		>
			{label}
			{children}
		</label>
	);
}
