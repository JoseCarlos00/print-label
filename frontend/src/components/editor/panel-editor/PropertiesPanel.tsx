import { useEffect, useRef } from 'react';
import { Barcode, FileText, Move, QrCode, Type, Image, Square } from 'lucide-react';
import type { LabelElement, Rotation } from 'shared';
import { useEditorStore } from '@/store/useEditorStore';
import { QrFields } from './QrFields';
import { TextFields } from './TextFields';
import { BarcodeFields } from './BarcodeFields';
import { NumberField } from './NumberField';
import { Field } from './Field';
import { TextAreaField } from './TextAreaField';
import { PanelSection } from './PanelSection';
import { ShapeFields } from './ShapeFields';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EDITOR_LIMITS } from '@/config/editorLimits';
import { ImageFields } from './ImageFields';

const TYPE_ICON = { text: Type, barcode: Barcode, qr: QrCode, image: Image, shape: Square } as const;
const TYPE_LABEL = {
	text: 'Texto',
	barcode: 'Código de barras',
	qr: 'Código QR',
	image: 'Imagen',
	shape: 'Forma',
} as const;
const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export function PropertiesPanel() {
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const element = useEditorStore((s) => s.elements.find((el) => el.id === s.selectedElementId));
	const updateElement = useEditorStore((s) => s.updateElement);
	const focusContentRequest = useEditorStore((s) => s.focusContentRequest);

	const contentRef = useRef<HTMLTextAreaElement>(null);

	const positionDisabled = Boolean(element?.positionLocked);

	useEffect(() => {
		if (!focusContentRequest) return;
		contentRef.current?.focus();
		contentRef.current?.select();
	}, [focusContentRequest]);

	if (!selectedElementId || !element) {
		return (
			<div className='p-4'>
				<p className='text-sm text-app-text-muted'>Selecciona un elemento para editar sus propiedades.</p>
			</div>
		);
	}

	const update = (changes: Partial<LabelElement>) => updateElement(element.id, changes);
	const Icon = TYPE_ICON[element.type];

	return (
		<div className='flex flex-col gap-3 p-3'>
			<div className='flex items-center gap-2 rounded-md border border-app-border bg-app-surface px-3 py-2'>
				<Icon className='size-4 text-app-accent-500' />
				<span className='text-sm font-medium text-app-text'>{TYPE_LABEL[element.type]}</span>
			</div>

			{positionDisabled && (
				<p className='rounded-md border border-app-border bg-app-surface p-2 text-xs text-app-text-muted'>
					La posición y el tamaño están bloqueados; puedes editar el contenido y el formato.
				</p>
			)}

			<PanelSection
				title='Posición y rotación'
				icon={<Move className='size-3.5' />}
			>
				<fieldset
					disabled={positionDisabled}
					className='grid grid-cols-2 gap-2 disabled:opacity-50'
				>
					<NumberField
						label='X (mm)'
						value={element.x}
						onChange={(x) => update({ x })}
					/>
					<NumberField
						label='Y (mm)'
						value={element.y}
						onChange={(y) => update({ y })}
					/>
				</fieldset>

				<Field label='Rotación'>
					<Select
						value={String(element.rotation)}
						onValueChange={(value) => update({ rotation: Number(value) as Rotation })}
					>
						<SelectTrigger className='mt-1 w-full'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ROTATIONS.map((rotation) => (
								<SelectItem
									key={rotation}
									value={String(rotation)}
								>
									{rotation}°
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			</PanelSection>

			{(element.type === 'text' || element.type === 'barcode' || element.type === 'qr') && (
				<PanelSection
					title='Contenido'
					icon={<FileText className='size-3.5' />}
				>
					<TextAreaField
						ref={contentRef}
						label='Contenido'
						value={element.content}
						onChange={(content) => update({ content })}
						maxLength={EDITOR_LIMITS.contentLength[element.type]}
						rows={2}
					/>
				</PanelSection>
			)}

			<PanelSection
				title='Propiedades'
				icon={<Icon className='size-3.5' />}
			>
				<div className='space-y-2'>
					{element.type === 'text' && (
						<TextFields
							element={element}
							onChange={update}
						/>
					)}
					{element.type === 'barcode' && (
						<BarcodeFields
							element={element}
							onChange={update}
							sizeLocked={positionDisabled}
						/>
					)}
					{element.type === 'qr' && (
						<QrFields
							element={element}
							onChange={update}
							sizeLocked={positionDisabled}
						/>
					)}
					{element.type === 'image' && (
						<ImageFields
							element={element}
							onChange={update}
							sizeLocked={positionDisabled}
						/>
					)}
					{element.type === 'shape' && (
						<ShapeFields
							element={element}
							onChange={update}
							sizeLocked={positionDisabled}
						/>
					)}
				</div>
			</PanelSection>
		</div>
	);
}
