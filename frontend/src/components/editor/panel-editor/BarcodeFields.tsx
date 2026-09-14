import type { BarcodeElement, Symbology } from 'shared';

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

			<label className='block text-xs text-app-text-muted'>
				Ancho (mm)
				<input
					type='number'
					value={element.width}
					onChange={(e) => onChange({ width: Number(e.target.value) })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</label>

			<label className='block text-xs text-app-text-muted'>
				Altura (mm)
				<input
					type='number'
					value={element.height}
					onChange={(e) => onChange({ height: Number(e.target.value) })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</label>

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
