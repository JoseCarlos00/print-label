import type { BarcodeElement, Symbology } from 'shared';
import { NumberField } from './NumberField'
import { EDITOR_LIMITS } from '../../../utils/editorLimits'

const SYMBOLOGIES: Symbology[] = ['code128', 'ean13'];

const SYMBOLOGY_LABELS: Record<Symbology, string> = {
  code128: 'Code 128',
  ean13: 'EAN-13',
};

export function BarcodeFields({
	element,
	onChange,
}: {
	element: BarcodeElement;
	onChange: (changes: Partial<BarcodeElement>) => void;
}) {
	return (
		<>
			<label className='block text-xs text-app-text-muted'>
				Simbología
				<select
					value={element.symbology}
					onChange={(e) => onChange({ symbology: e.target.value as Symbology })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				>
					{SYMBOLOGIES.map((s) => (
						<option
							key={s}
							value={s}
						>
							{SYMBOLOGY_LABELS[s]}
						</option>
					))}
				</select>
			</label>

			<NumberField
				label='Ancho (mm)'
				value={element.width}
				min={EDITOR_LIMITS.dimensionMm.min}
				max={EDITOR_LIMITS.dimensionMm.max}
				onChange={(width) => onChange({ width })}
			/>

			<NumberField
				label='Altura (mm)'
				value={element.height}
				min={EDITOR_LIMITS.dimensionMm.min}
				max={EDITOR_LIMITS.dimensionMm.max}
				onChange={(height) => onChange({ height })}
			/>

			<label className='flex items-center gap-2 text-xs text-app-text-muted'>
				<input
					type='checkbox'
					checked={element.showText}
					onChange={(e) => onChange({ showText: e.target.checked })}
				/>
				Mostrar texto legible
			</label>
		</>
	);
}
