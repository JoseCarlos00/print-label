import React from 'react';
import { Barcode, Circle, ImagePlus, Minus, Plus, QrCode, Square, Type, type LucideIcon } from 'lucide-react';

import { useEditorStore } from '@/store/useEditorStore';
import { useImageImport } from '@/hooks/useImageImport';
import type { ShapeType } from 'shared';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
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
	{ type: 'text', label: 'Texto', icon: Type },
	{ type: 'barcode', label: 'Código de barras', icon: Barcode },
	{ type: 'qr', label: 'Código QR', icon: QrCode },
];

interface ShapeButton {
	shape: ShapeType;
	label: string;
	icon: LucideIcon;
}

const SHAPES: ShapeButton[] = [
	{ shape: 'rectangle', label: 'Rectángulo', icon: Square },
	{ shape: 'line', label: 'Línea', icon: Minus },
	{ shape: 'ellipse', label: 'Elipse', icon: Circle },
];

export function Toolbar() {
	const addElement = useEditorStore((s) => s.addElement);
	const addShapeElement = useEditorStore((s) => s.addShapeElement);
	const profile = useEditorStore((s) => s.profile);

	const { inputRef, accept, openPicker, handleFileChange } = useImageImport();

	const disabled = !profile;

	return (
		<div className='absolute z-30 left-3 top-2'>
			{/* Fuera del dropdown a propósito: el menú se desmonta al cerrarse
			    y el onChange se perdería. */}
			<input
				ref={inputRef}
				type='file'
				accept={accept}
				className='hidden'
				onChange={handleFileChange}
			/>

			{/* Desktop */}
			<div className='w-20 hidden items-start rounded-lg border border-app-border bg-app-surface p-1 shadow-md lg:flex lg:flex-col'>
				{BUTTONS.map(({ type, label, icon: Icon }) => (
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

						<Separator className='my-1 w-full bg-app-border' />
					</React.Fragment>
				))}

				<button
					type='button'
					disabled={disabled}
					onClick={openPicker}
					title='Imagen'
					className='flex flex-col items-center cursor-pointer w-full gap-2 rounded-md px-0.5 py-2 text-xs text-app-text transition-colors hover:bg-app-bg disabled:pointer-events-none disabled:opacity-50'
				>
					<ImagePlus className='size-5' />
					<span>Imagen</span>
				</button>

				<Separator className='my-1 w-full bg-app-border' />

				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<button
								type='button'
								disabled={disabled}
								title='Forma'
								className='flex flex-col items-center cursor-pointer w-full gap-2 rounded-md px-0.5 py-2 text-xs text-app-text transition-colors hover:bg-app-bg disabled:pointer-events-none disabled:opacity-50'
							>
								<Square className='size-5' />
								<span>Forma</span>
							</button>
						}
					/>
					<DropdownMenuContent
						align='start'
						side='right'
					>
						{SHAPES.map(({ shape, label, icon: Icon }) => (
							<DropdownMenuItem
								key={shape}
								className='gap-2'
								onClick={() => addShapeElement(shape)}
							>
								<Icon className='size-4' />
								{label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
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
						{BUTTONS.map(({ type, label, icon: Icon }) => (
							<React.Fragment key={type}>
								<DropdownMenuItem
									className='w-full gap-2'
									onClick={() => addElement(type)}
								>
									<Icon className='size-4' />
									{label}
								</DropdownMenuItem>

								<DropdownMenuSeparator />
							</React.Fragment>
						))}

						<DropdownMenuItem
							className='w-full gap-2'
							onClick={openPicker}
						>
							<ImagePlus className='size-4' />
							Imagen
						</DropdownMenuItem>

						<DropdownMenuSeparator />
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className='gap-2'>
								<Square className='size-4' />
								Forma
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								{SHAPES.map(({ shape, label, icon: Icon }) => (
									<DropdownMenuItem
										key={shape}
										className='gap-2'
										onClick={() => addShapeElement(shape)}
									>
										<Icon className='size-4' />
										{label}
									</DropdownMenuItem>
								))}
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
