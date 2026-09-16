import { Barcode, Plus, QrCode, Type, type LucideIcon } from 'lucide-react';

import { useEditorStore } from '@/store/useEditorStore';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ToolbarButton {
	type: 'text' | 'barcode' | 'qr';
	label: string;
	icon: LucideIcon;
}

const BUTTONS: ToolbarButton[] = [
	{
		type: 'text',
		label: 'Texto',
		icon: Type,
	},
	{
		type: 'barcode',
		label: 'Código de barras',
		icon: Barcode,
	},
	{
		type: 'qr',
		label: 'Código QR',
		icon: QrCode,
	},
];

export function Toolbar() {
	const addElement = useEditorStore((s) => s.addElement);
	const positionLocked = useEditorStore((s) => s.positionLocked);
	const profile = useEditorStore((s) => s.profile);

	const disabled = positionLocked || !profile;

	return (
		<div className='absolute left-3 top-2'>
			{/* Desktop */}
			<div className='hidden items-start gap-1 rounded-lg border border-app-border bg-app-surface p-1 shadow-md lg:flex lg:flex-col'>
				{BUTTONS.map(({ type, label, icon: Icon }) => (
					<button
						key={type}
						type='button'
						disabled={disabled}
						onClick={() => addElement(type)}
						title={label}
						className='flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-app-text transition-colors hover:bg-app-bg disabled:pointer-events-none disabled:opacity-50'
					>
						<Icon className='size-4' />
						<span>{label}</span>
					</button>
				))}
			</div>

			{/* Mobile */}
			<div className='lg:hidden'>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type='button'
							disabled={disabled}
							size='sm'
							className='shadow-md'
						>
							<Plus />
							Agregar
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align='center'>
						{BUTTONS.map(({ type, label, icon: Icon }) => (
							<DropdownMenuItem
								key={type}
								onClick={() => addElement(type)}
							>
								<Icon />
								{label}
							</DropdownMenuItem>
						))}

						{positionLocked && (
							<>
								<DropdownMenuSeparator />
								<div className='px-2 py-1.5 text-xs text-muted-foreground'>Las posiciones están bloqueadas.</div>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
