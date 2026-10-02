import type { ShapeElement, ShapeType } from 'shared';
import { Field } from './Field';
import { NumberField } from './NumberField';
import { EDITOR_LIMITS } from '@/config/editorLimits';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SHAPES: { shape: ShapeType; label: string }[] = [
	{ shape: 'rectangle', label: 'Rectángulo' },
	{ shape: 'line', label: 'Línea' },
	{ shape: 'ellipse', label: 'Elipse' },
];

export function ShapeFields({
	element,
	onChange,
	sizeLocked = false,
}: {
	element: ShapeElement;
	onChange: (changes: Partial<ShapeElement>) => void;
	sizeLocked?: boolean;
}) {
	return (
		<>
			<Field label='Tipo de forma'>
				<Select
					value={element.shape}
					onValueChange={(value) => {
						const selectedShape = SHAPES.find(({ shape }) => shape === value)?.shape;
						if (!selectedShape) return;

						onChange({
							shape: selectedShape,
							...(element.shape === 'line' && selectedShape !== 'line' ? { height: 25 } : {}),
						});
					}}
				>
					<SelectTrigger className='mt-1 w-full'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{SHAPES.map(({ shape, label }) => (
							<SelectItem
								key={shape}
								value={shape}
							>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			<div className='grid grid-cols-2 gap-2'>
				<NumberField
					label='Ancho (mm)'
					value={element.width}
					min={1}
					max={EDITOR_LIMITS.dimensionMm.max}
					disabled={sizeLocked}
					onChange={(width) => {
						if (width !== undefined) onChange({ width });
					}}
				/>
				<NumberField
					label='Alto (mm)'
					value={element.height}
					min={1}
					max={EDITOR_LIMITS.dimensionMm.max}
					disabled={sizeLocked}
					onChange={(height) => {
						if (height !== undefined) onChange({ height });
					}}
				/>
			</div>

			<NumberField
				label='Grosor de línea (mm)'
				value={element.strokeWidth}
				min={0.2}
				max={20}
				step={0.2}
				onChange={(strokeWidth) => {
					if (strokeWidth !== undefined) onChange({ strokeWidth });
				}}
			/>

			{element.shape === 'rectangle' && (
				<NumberField
					label='Radio de esquinas (mm)'
					value={element.radius ?? 0}
					min={0}
					max={Math.min(element.width, element.height) / 2}
					step={0.5}
					onChange={(radius) => onChange({ radius: radius ?? 0 })}
				/>
			)}

			<div className='my-2 flex items-center justify-between'>
				<Label
					htmlFor={`filled-shape-${element.id}`}
					className='w-full cursor-pointer text-xs font-normal text-app-text-muted'
				>
					Rellenar forma
				</Label>
				<Switch
					id={`filled-shape-${element.id}`}
					checked={element.filled}
					disabled={element.shape === 'line'}
					onCheckedChange={(filled) => onChange({ filled })}
				/>
			</div>
		</>
	);
}
