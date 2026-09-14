import type { TextAlign, TextElement } from 'shared';
import { Field } from './Field';
import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '../../../utils/editorLimits';

const TEXT_ALIGNS: TextAlign[] = [
	'Left',
	'Center',
	'Right',
	'Justify',
];

export function TextFields({
	element,
	onChange,
}: {
	element: TextElement;
	onChange: (changes: Partial<TextElement>) => void;
}) {
	return (
		<>
			<NumberField
				label='Tamaño de fuente (mm)'
				value={element.fontSize}
				min={EDITOR_LIMITS.fontSizeMm.min}
				max={EDITOR_LIMITS.fontSizeMm.max}
				onChange={(fontSize) => onChange({ fontSize })}
			/>

			<label className='flex items-center gap-2 text-xs text-app-text-muted'>
				<input
					type='checkbox'
					checked={element.bold}
					onChange={(e) => onChange({ bold: e.target.checked })}
				/>
				Negrita
			</label>

			<NumberField
				label='Ancho de ajuste (mm, opcional)'
				value={element.wrapWidth}
				min={EDITOR_LIMITS.dimensionMm.min}
				max={EDITOR_LIMITS.dimensionMm.max}
				placeholder='100 mm'
				onChange={(wrapWidth) => onChange({ wrapWidth })}
			/>

			{element.wrapWidth !== undefined && (
				<Field label='Alineación'>
					<select
						value={element.textAlign ?? 'L'}
						onChange={(e) =>
							onChange({
								textAlign: e.target.value as TextAlign,
							})
						}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
					>
						{TEXT_ALIGNS.map((align) => (
							<option key={align} value={align}>
								{align}
							</option>
						))}
					</select>
				</Field>
			)}
		</>
	);
}
