import type { QrElement, QrLabel } from 'shared';
import { Field } from './Field';
import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '@/config/editorLimits'

export function QrFields({
	element,
	onChange,
}: {
	element: QrElement;
	onChange: (changes: Partial<QrElement>) => void;
}) {
	const label = element.label;

	const labelVisible = label.visible ?? false;
	const customTextEnabled = label.customText !== undefined;
	const wrapEnabled = label.wrapWidth !== undefined;

	const updateLabel = (changes: Partial<QrLabel>) => {
		const base: QrLabel = label ?? {
			fontSize: 3,
			visible: true,
		};

		onChange({
			label: {
				...base,
				...changes,
			},
		});
	};

	return (
		<>
			<NumberField
				label='Tamaño (factor)'
				value={element.size}
				min={EDITOR_LIMITS.qrSizeMm.min}
				max={EDITOR_LIMITS.qrSizeMm.max}
				onChange={(size) => {
					if (size !== undefined) {
						onChange({ size });
					}
				}}
			/>

			<label className='flex items-center gap-2 text-xs text-app-text-muted my-3 cursor-pointer'>
				<input
					type='checkbox'
					checked={labelVisible}
					onChange={(e) =>
						updateLabel({
							visible: e.target.checked,
						})
					}
				/>
				Mostrar etiqueta con el contenido
			</label>

			<NumberField
				label='Tamaño de fuente (mm)'
				value={label?.fontSize}
				min={EDITOR_LIMITS.fontSizeMm.min}
				max={EDITOR_LIMITS.fontSizeMm.max}
				disabled={!labelVisible}
				onChange={(fontSize) => {
					if (fontSize !== undefined) {
						updateLabel({ fontSize });
					}
				}}
			/>

			<label
				className={[
					'flex items-center gap-2 text-xs text-app-text-muted my-3 cursor-pointer',
					!labelVisible && 'opacity-55',
				]
					.filter(Boolean)
					.join(' ')}
			>
				<input
					type='checkbox'
					checked={customTextEnabled}
					disabled={!labelVisible}
					onChange={(e) =>
						updateLabel({
							customText: e.target.checked ? '' : undefined,
						})
					}
				/>
				Usar texto personalizado
			</label>

			<Field
				label='Texto de la etiqueta'
				disabled={!labelVisible || !customTextEnabled}
			>
				<input
					type='text'
					value={label?.customText ?? ''}
					disabled={!labelVisible || !customTextEnabled}
					onChange={(e) =>
						updateLabel({
							customText: e.target.value,
						})
					}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</Field>

			<label
				className={[
					'flex items-center gap-2 text-xs text-app-text-muted my-3 cursor-pointer',
					!labelVisible && 'opacity-55',
				]
					.filter(Boolean)
					.join(' ')}
			>
				<input
					type='checkbox'
					checked={wrapEnabled}
					disabled={!labelVisible}
					onChange={(e) =>
						updateLabel({
							wrapWidth: e.target.checked ? 50 : undefined,
						})
					}
				/>
				Ajustar ancho del texto
			</label>

			<NumberField
				label='Ancho de ajuste (mm)'
				value={label?.wrapWidth}
				min={EDITOR_LIMITS.dimensionMm.min}
				max={EDITOR_LIMITS.dimensionMm.max}
				disabled={!labelVisible || !wrapEnabled}
				onChange={(wrapWidth) => updateLabel({ wrapWidth })}
			/>
		</>
	);
}
