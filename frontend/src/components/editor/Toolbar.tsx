import React from 'react';
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
import { Separator } from '@/components/ui/separator';

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
			<div className='w-20 hidden items-start rounded-lg border border-app-border bg-app-surface p-1 shadow-md lg:flex lg:flex-col'>
				{BUTTONS.map(({ type, label, icon: Icon }, index) => (
					<React.Fragment key={type}>
						<button
							type='button'
							disabled={disabled}
							onClick={() => addElement(type)}
							title={label}
							className='flex flex-col items-center cursor-pointer w-full gap-2 rounded-md px-0.5 py-2 text-xs text-app-text transition-colors hover:bg-app-bg disabled:pointer-events-none disabled:opacity-50'
						>
							<Icon className='size-5' />
							<span>{label}</span>
						</button>

						{/* Separador entre botones */}
						{index < BUTTONS.length - 1 && <Separator className='my-1 w-full bg-app-border' />}
					</React.Fragment>
				))}
			</div>

			{/* Mobile */}
			<div className='lg:hidden'>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								type='button'
								disabled={disabled}
								size='sm'
								className='shadow-md'
							>
								<Plus />
								Agregar
							</Button>
						}
					/>

					<DropdownMenuContent align='center'>
						{BUTTONS.map(({ type, label, icon: Icon }, index) => (
							<React.Fragment key={type}>
								<DropdownMenuItem
									className='w-full gap-2 cursor-pointer'
									onClick={() => addElement(type)}
								>
									<Icon className='size-4' />
									{label}
								</DropdownMenuItem>

								{/* Imprime el separador solo entre elementos (no después del último) */}
								{index < BUTTONS.length - 1 && <DropdownMenuSeparator />}
							</React.Fragment>
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
