import type { BarcodeElement, Symbology } from 'shared';

import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '../../../config/editorLimits';
import { Field } from './Field';

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
	const aspectRatio = element.height > 0 ? element.width / element.height : 1;

	const updateWidth = (width: number | undefined) => {
		if (width === undefined) {
			return;
		}

		if (!aspectRatio) {
			onChange({ width });
			return;
		}

		const height = width / aspectRatio;

		const clampedHeight = Math.min(EDITOR_LIMITS.dimensionMm.max, Math.max(EDITOR_LIMITS.dimensionMm.min, height));

		onChange({
			width,
			height: clampedHeight,
		});
	};

	const updateHeight = (height: number | undefined) => {
		if (height === undefined) {
			return;
		}

		if (!aspectRatio) {
			onChange({ height });
			return;
		}

		const width = height * aspectRatio;

		const clampedWidth = Math.min(EDITOR_LIMITS.dimensionMm.max, Math.max(EDITOR_LIMITS.dimensionMm.min, width));

		onChange({
			width: clampedWidth,
			height,
		});
	};

	return (
		<>
			<Field label='Simbología'>
				<select
					value={element.symbology}
					onChange={(e) =>
						onChange({
							symbology: e.target.value as Symbology,
						})
					}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				>
					{SYMBOLOGIES.map((symbology) => (
						<option
							key={symbology}
							value={symbology}
						>
							{SYMBOLOGY_LABELS[symbology]}
						</option>
					))}
				</select>
			</Field>

			<NumberField
				label='Ancho (mm)'
				value={element.width}
				min={EDITOR_LIMITS.dimensionMm.min}
				max={EDITOR_LIMITS.dimensionMm.max}
				inputClassName={element.lockAspectRatio ? 'outline outline-1 outline-blue-500' : undefined}
				onChange={updateWidth}
			/>

			<label className='flex items-center gap-2 text-xs text-app-text-muted cursor-pointer justify-center'>
				<input
					type='checkbox'
					hidden
					checked={element.lockAspectRatio}
					onChange={(e) =>
						onChange({
							lockAspectRatio: e.target.checked,
						})
					}
				/>
				<IconBlock lock={element.lockAspectRatio} />
				{element.lockAspectRatio ? 'Desbloquear' : 'Bloquear'} relación de aspecto
			</label>

			<NumberField
				label='Altura (mm)'
				value={element.height}
				min={EDITOR_LIMITS.dimensionMm.min}
				max={EDITOR_LIMITS.dimensionMm.max}
				inputClassName={element.lockAspectRatio ? 'outline outline-1 outline-blue-500' : undefined}
				onChange={updateHeight}
			/>

			<label className='flex items-center gap-2 text-xs text-app-text-muted my-3 cursor-pointer text-center'>
				<input
					type='checkbox'
					checked={element.showText}
					onChange={(e) =>
						onChange({
							showText: e.target.checked,
						})
					}
				/>
				Mostrar texto legible
			</label>
		</>
	);
}

const IconBlock = ({ lock } : { lock: boolean }) => {
	const dataPath = lock
		? 'M299 155q17 0 29.5 12.5T341 197v214q0 17-12.5 29.5T299 453H43q-18 0-30.5-12.5T0 411V197q0-17 12.5-29.5T43 155h21v-43q0-44 31.5-75.5T171 5t75 31.5t31 75.5v43h22zM170.5 347q17.5 0 30-12.5T213 304t-12.5-30.5t-30-12.5t-30 12.5T128 304t12.5 30.5t30 12.5zM237 155v-43q0-27-19.5-46.5t-47-19.5T124 65.5T105 112v43h132z'
		: 'M7 0C4.79 0 2.878.917 1.687 2.406C.498 3.896 0 5.826 0 7.906V11h3V7.906c0-1.58.389-2.82 1.031-3.625C4.674 3.477 5.541 3 7 3c1.463 0 2.328.45 2.969 1.25c.64.8 1.031 2.06 1.031 3.656V9h3V7.906c0-2.092-.527-4.044-1.719-5.531C11.09.888 9.206 0 7 0zm2 10c-1.656 0-3 1.344-3 3v10c0 1.656 1.344 3 3 3h14c1.656 0 3-1.344 3-3V13c0-1.656-1.344-3-3-3H9zm7 5a2 2 0 0 1 2 2c0 .738-.404 1.372-1 1.719V21c0 .551-.449 1-1 1c-.551 0-1-.449-1-1v-2.281c-.596-.347-1-.98-1-1.719a2 2 0 0 1 2-2z';

	const viewBox = lock ? '0 0 344 456' : '0 0 26 26';

	return (
		<svg
		className='size-3'
			viewBox={viewBox}
			xmlns='http://www.w3.org/2000/svg'
		>
			<path
				d={dataPath}
				fill='currentColor'
			/>
		</svg>
	);
};

