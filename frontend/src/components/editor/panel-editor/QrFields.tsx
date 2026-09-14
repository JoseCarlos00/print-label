import { useState } from 'react'
import type { QrElement, QrLabel } from 'shared';

export function QrFields({ element, onChange }: { element: QrElement; onChange: (changes: Partial<QrElement>) => void; }) {
	const label = element.label;
  const [wrapWidth, setWrapWidth] = useState(false);


	const updateLabel = (changes: Partial<QrLabel>) => {
		const base: QrLabel = label ?? { fontSize: 3, visible: true };
		onChange({ label: { ...base, ...changes } });
	};

	const classOpacity = label?.visible ? '' : 'opacity-55';

	return (
		<>
			<label className='block text-xs text-app-text-muted'>
				Tamaño (factor)
				<input
					type='number'
					min={1}
					value={element.size}
					onChange={(e) => onChange({ size: Number(e.target.value) })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</label>

			<label className='flex items-center gap-2 text-xs text-app-text-muted'>
				<input
					type='checkbox'
					checked={label?.visible ?? false}
					onChange={(e) => updateLabel({ visible: e.target.checked })}
				/>
				Mostrar etiqueta con el contenido
			</label>

			<label className={`block text-xs text-app-text-muted ${classOpacity}`}>
				Tamaño de fuente (mm)
				<input
					type='number'
					value={label?.fontSize}
					onChange={(e) => updateLabel({ fontSize: Number(e.target.value) })}
					className={`mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text ${classOpacity}`}
				/>
			</label>

			<label className={`flex items-center gap-2 text-xs text-app-text-muted ${classOpacity}`}>
				<input
					className={classOpacity}
					type='checkbox'
					checked={label?.customText !== undefined}
					onChange={(e) =>
						updateLabel({ customText: e.target.checked ? (label?.customText ?? element.content) : undefined })
					}
				/>
				Usar texto personalizado
			</label>

			<label className={`block text-xs text-app-text-muted ${classOpacity} ${label?.customText ? '' : 'opacity-55'}`}>
				Texto de la etiqueta
				<input
					disabled={!label?.visible}
					value={label?.customText}
					onChange={(e) => updateLabel({ customText: e.target.value })}
					className={`mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text ${classOpacity}`}
				/>
			</label>

			<label className={`flex items-center gap-2 text-xs text-app-text-muted ${classOpacity}`}>
				<input
					className={classOpacity}
					type='checkbox'
					checked={wrapWidth}
					onChange={(e) => setWrapWidth(e.target.checked)}
				/>
				wrapWidth
			</label>

			<label className={`block text-xs text-app-text-muted ${classOpacity} ${wrapWidth ? '' : 'opacity-55'}`}>
				wrapWidth (mm)
				<input
					disabled={!label?.visible}
					value={label?.wrapWidth}
					onChange={(e) => updateLabel({ wrapWidth: Number(e.target.value) })}
					className={`mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text ${classOpacity}`}
				/>
			</label>
		</>
	);
}
