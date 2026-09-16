import type { TextAlign, TextElement } from 'shared';
import { Field } from './Field';
import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '@/config/editorLimits';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
			<div className='mb-3 flex items-center justify-between'>
				<Label
					htmlFor='enableTextBold'
					className='text-xs font-normal text-app-text-muted w-full cursor-pointer'
				>
					Negrita
				</Label>
				<Switch
					id='enableTextBold'
					checked={element.bold}
					onCheckedChange={(bold) => onChange({ bold })}
				/>
			</div>

			<NumberField
				label='Tamaño de fuente (mm)'
				value={element.fontSize}
				min={EDITOR_LIMITS.fontSizeMm.min}
				max={EDITOR_LIMITS.fontSizeMm.max}
				onChange={(fontSize) => {
					if (fontSize !== undefined) onChange({ fontSize });
				}}
			/>

			<div className='my-3 flex items-center justify-between'>
				<Label
					htmlFor='wrapTextEnabled'
					className='text-xs font-normal text-app-text-muted w-full cursor-pointer'
				>
					Ajustar ancho del texto
				</Label>
				<Switch
					id='wrapTextEnabled'
					checked={wrapEnabled}
					onCheckedChange={(checked) => onChange({ wrapWidth: checked ? 50 : undefined })}
				/>
			</div>

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
				<Select
					value={element.textAlign ?? 'Left'}
					disabled={!wrapEnabled}
					onValueChange={(value) => onChange({ textAlign: value as TextAlign })}
				>
					<SelectTrigger className='mt-1 w-full'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TEXT_ALIGNS.map((align) => (
							<SelectItem
								key={align}
								value={align}
							>
								{align}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
		</>
	);
}
