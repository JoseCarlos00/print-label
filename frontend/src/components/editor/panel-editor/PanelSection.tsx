import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from 'cn';

interface PanelSectionProps {
	title: string;
	icon: ReactNode;
	children: ReactNode;
	defaultOpen?: boolean;
}

export function PanelSection({ title, icon, children, defaultOpen = true }: PanelSectionProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className='rounded-md border border-app-border bg-app-surface/40'
		>
			<CollapsibleTrigger className='flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left'>
				<span className='flex items-center gap-2 text-xs font-medium uppercase text-app-text-muted'>
					{icon}
					{title}
				</span>
				<ChevronDown className={cn('size-3.5 text-app-text-muted transition-transform', open && 'rotate-180')} />
			</CollapsibleTrigger>
			<CollapsibleContent className='space-y-2 px-3 pb-3 text-sm'>{children}</CollapsibleContent>
		</Collapsible>
	);
}
