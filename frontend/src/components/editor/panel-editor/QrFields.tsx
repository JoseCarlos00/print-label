import type { QrElement, QrLabel } from 'shared';
import { Field } from './Field';
import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '@/config/editorLimits';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
		const base: QrLabel = label ?? { fontSize: 3, visible: true };
		onChange({ label: { ...base, ...changes } });
	};

	return (
		<>
			<NumberField
				label='Tamaño (mm)'
				value={element.size}
				min={EDITOR_LIMITS.qrSizeMm.min}
				max={EDITOR_LIMITS.qrSizeMm.max}
				onChange={(size) => {
					if (size !== undefined) onChange({ size });
				}}
			/>

			<div className='my-3 flex items-center justify-between'>
				<Label
					htmlFor='showQrLabel'
					className='text-xs font-normal text-app-text-muted w-full cursor-pointer'
				>
					Mostrar etiqueta con el contenido
				</Label>
				<Switch
					id='showQrLabel'
					checked={labelVisible}
					onCheckedChange={(visible) => updateLabel({ visible })}
				/>
			</div>

			<NumberField
				label='Tamaño de fuente (mm)'
				value={label?.fontSize}
				min={EDITOR_LIMITS.fontSizeMm.min}
				max={EDITOR_LIMITS.fontSizeMm.max}
				disabled={!labelVisible}
				onChange={(fontSize) => {
					if (fontSize !== undefined) updateLabel({ fontSize });
				}}
			/>

			<div className='my-3 flex items-center justify-between opacity-100 data-disabled:opacity-55'>
				<Label
					htmlFor='customQrLabel'
					className='text-xs font-normal text-app-text-muted w-full cursor-pointer'
				>
					Usar texto personalizado
				</Label>
				<Switch
					id='customQrLabel'
					checked={customTextEnabled}
					disabled={!labelVisible}
					onCheckedChange={(checked) => updateLabel({ customText: checked ? '' : undefined })}
				/>
			</div>

			<Field
				label='Texto de la etiqueta'
				disabled={!labelVisible || !customTextEnabled}
			>
				<Input
					type='text'
					value={label?.customText ?? ''}
					disabled={!labelVisible || !customTextEnabled}
					onChange={(e) => updateLabel({ customText: e.target.value })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text disabled:opacity-50'
				/>
			</Field>

			<div className='my-3 flex items-center justify-between'>
				<Label
					htmlFor='wrapQrEnabled'
					className='text-xs font-normal text-app-text-muted w-full cursor-pointer'
				>
					Ajustar ancho del texto
				</Label>
				<Switch
					id='wrapQrEnabled'
					checked={wrapEnabled}
					disabled={!labelVisible}
					onCheckedChange={(checked) => updateLabel({ wrapWidth: checked ? 50 : undefined })}
				/>
			</div>

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
