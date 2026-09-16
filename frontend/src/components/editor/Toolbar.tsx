import { Barcode, QrCode, Type, type LucideIcon } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

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

export function Toolbar() {
	const addElement = useEditorStore((s) => s.addElement);
	const positionLocked = useEditorStore((s) => s.positionLocked);
	const profile = useEditorStore((s) => s.profile);

	const disabled = positionLocked || !profile;

	return (
		<div className='flex w-12 shrink-0 flex-col items-stretch gap-1 border-r border-app-border p-2 sm:w-44'>
			<p className='hidden text-[10px] font-medium uppercase text-app-text-muted sm:block'>Agregar</p>

			{BUTTONS.map(({ type, label, icon: Icon }) => (
				<button
					key={type}
					disabled={disabled}
					onClick={() => addElement(type)}
					title={label}
					className='flex items-center justify-center gap-2 rounded-md border border-app-border px-2 py-2 text-sm text-app-text enabled:cursor-pointer enabled:hover:bg-app-surface disabled:opacity-50 sm:justify-start'
				>
					<Icon className='size-4 shrink-0' />
					<span className='hidden sm:inline'>{label}</span>
				</button>
			))}

			{positionLocked && (
				<p className='hidden text-[10px] text-app-text-muted sm:block'>
					Posiciones bloqueadas: no se pueden agregar ni quitar elementos.
				</p>
			)}
		</div>
	);
}
