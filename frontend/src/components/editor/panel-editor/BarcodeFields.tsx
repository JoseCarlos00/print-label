import { Lock, LockOpen } from 'lucide-react';
import type { BarcodeElement, Symbology } from 'shared';
import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '@/config/editorLimits';
import { Field } from './Field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
		if (width === undefined) return;
		if (!aspectRatio) return onChange({ width });

		const height = width / aspectRatio;
		const clampedHeight = Math.min(EDITOR_LIMITS.dimensionMm.max, Math.max(EDITOR_LIMITS.dimensionMm.min, height));
		onChange({ width, height: clampedHeight });
	};

	const updateHeight = (height: number | undefined) => {
		if (height === undefined) return;
		if (!aspectRatio) return onChange({ height });

		const width = height * aspectRatio;
		const clampedWidth = Math.min(EDITOR_LIMITS.dimensionMm.max, Math.max(EDITOR_LIMITS.dimensionMm.min, width));
		onChange({ width: clampedWidth, height });
	};

	return (
		<>
			<Field label='Simbología'>
				<Select
					value={element.symbology}
					onValueChange={(value) => onChange({ symbology: value as Symbology })}
				>
					<SelectTrigger className='mt-1 w-full'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{SYMBOLOGIES.map((symbology) => (
							<SelectItem
								key={symbology}
								value={symbology}
							>
								{SYMBOLOGY_LABELS[symbology]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			<div className='grid grid-cols-2 gap-2'>
				<NumberField
					label='Ancho (mm)'
					value={element.width}
					min={EDITOR_LIMITS.dimensionMm.min}
					max={EDITOR_LIMITS.dimensionMm.max}
					inputClassName={element.lockAspectRatio ? 'outline outline-1 outline-app-accent-500' : undefined}
					onChange={updateWidth}
				/>

				<NumberField
					label='Altura (mm)'
					value={element.height}
					min={EDITOR_LIMITS.dimensionMm.min}
					max={EDITOR_LIMITS.dimensionMm.max}
					inputClassName={element.lockAspectRatio ? 'outline outline-1 outline-app-accent-500' : undefined}
					onChange={updateHeight}
				/>
			</div>

			<div className='my-3 flex items-center justify-between'>
				<Label
					htmlFor='blockBarcodeRelationAspect'
					className='flex items-center gap-1.5 text-xs font-normal text-app-text-muted w-full cursor-pointer'
				>
					{element.lockAspectRatio ? <Lock className='size-3' /> : <LockOpen className='size-3' />}
					Bloquear relación de aspecto
				</Label>
				<Switch
					id='blockBarcodeRelationAspect'
					checked={element.lockAspectRatio}
					onCheckedChange={(lockAspectRatio) => onChange({ lockAspectRatio })}
				/>
			</div>

			<div className='my-3 flex items-center justify-between'>
				<Label
					htmlFor='showBarcodeText'
					className='text-xs font-normal text-app-text-muted w-full cursor-pointer'
				>
					Mostrar texto legible
				</Label>
				<Switch
					id='showBarcodeText'
					checked={element.showText}
					onCheckedChange={(showText) => onChange({ showText })}
				/>
			</div>
		</>
	);
}
