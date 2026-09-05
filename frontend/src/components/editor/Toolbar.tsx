import { useEditorStore } from '../../store/useEditorStore';

const BUTTONS: { type: 'text' | 'barcode' | 'qr'; label: string }[] = [
	{ type: 'text', label: 'Texto' },
	{ type: 'barcode', label: 'Código de barras' },
	{ type: 'qr', label: 'Código QR' },
];

export function Toolbar() {
	const addElement = useEditorStore((s) => s.addElement);
	const positionLocked = useEditorStore((s) => s.positionLocked);

	return (
		<div className='flex w-48 flex-col gap-2 border-r border-app-border p-4'>
			<p className='text-xs font-medium uppercase text-app-text-muted'>Agregar elemento</p>
			{BUTTONS.map(({ type, label }) => (
				<button
					key={type}
					disabled={positionLocked}
					onClick={() => addElement(type)}
					className='rounded-md border border-app-border px-3 py-2 text-left text-sm text-app-text hover:bg-app-surface disabled:opacity-50'
				>
					+ {label}
				</button>
			))}
			{positionLocked && (
				<p className='mt-2 text-xs text-app-text-muted'>
					Esta plantilla tiene las posiciones bloqueadas: no se pueden agregar ni quitar elementos.
				</p>
			)}
		</div>
	);
}
