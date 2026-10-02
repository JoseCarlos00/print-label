import { Lock, LockOpen } from 'lucide-react';
import type { ImageElement } from 'shared';
import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '@/config/editorLimits';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ImageFields({
	element,
	onChange,
	sizeLocked = false,
}: {
	element: ImageElement;
	onChange: (changes: Partial<ImageElement>) => void;
	sizeLocked?: boolean;
}) {
	const aspectRatio = element.height > 0 ? element.width / element.height : 1;

	const updateWidth = (width: number | undefined) => {
		if (width === undefined) return;
		if (!element.lockAspectRatio || !aspectRatio) return onChange({ width });

		const height = width / aspectRatio;
		const clampedHeight = Math.min(
			EDITOR_LIMITS.dimensionMm.max,
			Math.max(EDITOR_LIMITS.dimensionMm.min, height),
		);
		onChange({ width, height: clampedHeight });
	};

	const updateHeight = (height: number | undefined) => {
		if (height === undefined) return;
		if (!element.lockAspectRatio || !aspectRatio) return onChange({ height });

		const width = height * aspectRatio;
		const clampedWidth = Math.min(
			EDITOR_LIMITS.dimensionMm.max,
			Math.max(EDITOR_LIMITS.dimensionMm.min, width),
		);
		onChange({ width: clampedWidth, height });
	};

	return (
		<>
			<div className='grid grid-cols-2 gap-2'>
				<NumberField
					label='Ancho (mm)'
					value={element.width}
					min={EDITOR_LIMITS.dimensionMm.min}
					max={EDITOR_LIMITS.dimensionMm.max}
					inputClassName={element.lockAspectRatio ? 'outline outline-1 outline-app-accent-500' : undefined}
					disabled={sizeLocked}
					onChange={updateWidth}
				/>
				<NumberField
					label='Alto (mm)'
					value={element.height}
					min={EDITOR_LIMITS.dimensionMm.min}
					max={EDITOR_LIMITS.dimensionMm.max}
					inputClassName={element.lockAspectRatio ? 'outline outline-1 outline-app-accent-500' : undefined}
					disabled={sizeLocked}
					onChange={updateHeight}
				/>
			</div>

			<div className='my-3 flex items-center justify-between'>
				<Label
					htmlFor={`lock-image-aspect-${element.id}`}
					className='flex w-full cursor-pointer items-center gap-1.5 text-xs font-normal text-app-text-muted'
				>
					{element.lockAspectRatio ? <Lock className='size-3' /> : <LockOpen className='size-3' />}
					Bloquear relación de aspecto
				</Label>
				<Switch
					id={`lock-image-aspect-${element.id}`}
					checked={element.lockAspectRatio}
					onCheckedChange={(lockAspectRatio) => onChange({ lockAspectRatio })}
				/>
			</div>
		</>
	);
}
