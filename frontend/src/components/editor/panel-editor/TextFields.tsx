import type { TextAlign, TextElement } from 'shared';

const TEXT_ALIGNS: TextAlign[] = ['Left', 'Center', 'Right', 'Justify'];

export function TextFields({
	element,
	onChange,
}: {
	element: TextElement;
	onChange: (changes: Partial<TextElement>) => void;
}) {
	return (
		<>
			<label className='block text-xs text-app-text-muted'>
				Tamaño de fuente (mm)
				<input
					type='number'
					value={element.fontSize}
					onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</label>

			<label className='flex items-center gap-2 text-xs text-app-text-muted'>
				<input
					type='checkbox'
					checked={element.bold}
					onChange={(e) => onChange({ bold: e.target.checked })}
				/>
				Negrita
			</label>

			<label className='block text-xs text-app-text-muted'>
				Ancho de ajuste (mm, opcional)
				<input
					type='number'
					placeholder='100mm'
					value={element.wrapWidth ?? ''}
					onChange={(e) => onChange({ wrapWidth: e.target.value ? Number(e.target.value) : undefined })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</label>

			{element.wrapWidth !== undefined && (
				<label className='block text-xs text-app-text-muted'>
					Alineación
					<select
						value={element.textAlign ?? 'L'}
						onChange={(e) => onChange({ textAlign: e.target.value as TextAlign })}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
					>
						{TEXT_ALIGNS.map((a) => (
							<option
								key={a}
								value={a}
							>
								{a}
							</option>
						))}
					</select>
				</label>
			)}
		</>
	);
}
