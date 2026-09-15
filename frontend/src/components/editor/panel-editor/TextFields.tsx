import type { TextAlign, TextElement } from 'shared';
import { Field } from './Field';
import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '@/config/editorLimits';

const TEXT_ALIGNS: TextAlign[] = ['Left', 'Center', 'Right', 'Justify'];

export function TextFields({
	element,
	onChange,
}: {
	element: TextElement;
	onChange: (changes: Partial<TextElement>) => void;
}) {
	const wrapEnabled = element?.wrapWidth !== undefined;

	return (
		<>
			<label className='flex items-center gap-2 text-xs text-app-text-muted mb-3 cursor-pointer'>
				<input
					type='checkbox'
					checked={element.bold}
					onChange={(e) => onChange({ bold: e.target.checked })}
				/>
				Negrita
			</label>

			<NumberField
				label='Tamaño de fuente (mm)'
				value={element.fontSize}
				min={EDITOR_LIMITS.fontSizeMm.min}
				max={EDITOR_LIMITS.fontSizeMm.max}
				onChange={(fontSize) => {
					if (fontSize !== undefined) {
						onChange({ fontSize });
					}
				}}
			/>

			<label className='flex items-center gap-2 text-xs text-app-text-muted my-3 cursor-pointer'>
				<input
					type='checkbox'
					checked={wrapEnabled}
					onChange={(e) =>
						onChange({
							wrapWidth: e.target.checked ? 50 : undefined,
						})
					}
				/>
				Ajustar ancho del texto
			</label>

			<NumberField
				label='Ancho de ajuste (mm, opcional)'
				value={element.wrapWidth}
				disabled={!wrapEnabled}
				min={EDITOR_LIMITS.dimensionMm.min}
				max={EDITOR_LIMITS.dimensionMm.max}
				onChange={(wrapWidth) => onChange({ wrapWidth })}
			/>

			<Field
				label='Alineación'
				disabled={!wrapEnabled}
			>
				<select
					value={element.textAlign ?? 'Left'}
					disabled={!wrapEnabled}
					onChange={(e) =>
						onChange({
							textAlign: e.target.value as TextAlign,
						})
					}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				>
					{TEXT_ALIGNS.map((align) => (
						<option
							key={align}
							value={align}
						>
							{align}
						</option>
					))}
				</select>
			</Field>
		</>
	);
}
