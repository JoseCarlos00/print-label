import { useEffect, useRef } from 'react';
import { Barcode, FileText, Move, QrCode, Type } from 'lucide-react';
import type { ElementPatch } from '@/store/editorStore.types';
import type { Rotation } from 'shared';
import { useEditorStore } from '@/store/useEditorStore';
import { QrFields } from './QrFields';
import { TextFields } from './TextFields';
import { BarcodeFields } from './BarcodeFields';
import { NumberField } from './NumberField';
import { Field } from './Field';
import { TextAreaField } from './TextAreaField';
import { PanelSection } from './PanelSection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TYPE_ICON = { text: Type, barcode: Barcode, qr: QrCode } as const;
const TYPE_LABEL = { text: 'Texto', barcode: 'Código de barras', qr: 'Código QR' } as const;
const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export function PropertiesPanel() {
	const positionLocked = useEditorStore((s) => s.positionLocked);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const element = useEditorStore((s) => s.elements.find((el) => el.id === s.selectedElementId));
	const updateElement = useEditorStore((s) => s.updateElement);
	const focusContentRequest = useEditorStore((s) => s.focusContentRequest);

	const contentRef = useRef<HTMLTextAreaElement>(null);

	const structureDisabled = positionLocked;
	const contentDisabled = positionLocked && Boolean(element?.locked);

	useEffect(() => {
		if (!element || contentDisabled || !focusContentRequest) return;
		contentRef.current?.focus();
		contentRef.current?.select();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [focusContentRequest, contentDisabled]);

	if (!selectedElementId || !element) {
		return (
			<div className='p-4'>
				<p className='text-sm text-app-text-muted'>Selecciona un elemento para editar sus propiedades.</p>
			</div>
		);
	}

	const update = (changes: ElementPatch) => updateElement(element.id, changes);
	const Icon = TYPE_ICON[element.type];

	return (
		<div className='flex flex-col gap-3 overflow-y-auto p-3 thin-scrollbar'>
			<div className='flex items-center gap-2 rounded-md border border-app-border bg-app-surface px-3 py-2'>
				<Icon className='size-4 text-app-accent-500' />
				<span className='text-sm font-medium text-app-text'>{TYPE_LABEL[element.type]}</span>
			</div>

			{contentDisabled && (
				<p className='rounded-md border border-app-border bg-app-surface p-2 text-xs text-app-text-muted'>
					Este elemento está bloqueado en esta plantilla.
				</p>
			)}

			<PanelSection
				title='Posición y rotación'
				icon={<Move className='size-3.5' />}
			>
				<fieldset
					disabled={structureDisabled}
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

				<fieldset
					disabled={structureDisabled}
					className='disabled:opacity-50'
				>
					<Field label='Rotación'>
						<Select
							value={String(element.rotation)}
							onValueChange={(value) => update({ rotation: Number(value) as Rotation })}
							disabled={structureDisabled}
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
				</fieldset>
			</PanelSection>

			<PanelSection
				title='Contenido'
				icon={<FileText className='size-3.5' />}
			>
				<fieldset
					disabled={contentDisabled}
					className='disabled:opacity-50'
				>
					<TextAreaField
						ref={contentRef}
						label='Contenido'
						value={element.content}
						onChange={(content) => update({ content })}
						rows={2}
					/>
				</fieldset>
			</PanelSection>

			<PanelSection
				title='Propiedades'
				icon={<Icon className='size-3.5' />}
			>
				<fieldset
					disabled={structureDisabled}
					className='space-y-2 disabled:opacity-50'
				>
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
						/>
					)}
					{element.type === 'qr' && (
						<QrFields
							element={element}
							onChange={update}
						/>
					)}
				</fieldset>
			</PanelSection>
		</div>
	);
}
