import { useEffect, useRef } from 'react';
import type { ElementPatch } from '@/store/editorStore.types';
import type { Rotation} from 'shared'
import { useEditorStore } from '@/store/useEditorStore';
import { QrFields } from './QrFields'
import { TextFields } from './TextFields'
import { BarcodeFields } from './BarcodeFields'
import { NumberField } from './NumberField'
import { Field } from './Field';
import { TextAreaField } from './TextAreaField'


export function PropertiesPanel() {
	const positionLocked = useEditorStore((s) => s.positionLocked);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const element = useEditorStore((s) => s.elements.find((el) => el.id === s.selectedElementId));
	const updateElement = useEditorStore((s) => s.updateElement);
	const focusContentRequest = useEditorStore((s) => s.focusContentRequest);


	const contentRef = useRef<HTMLTextAreaElement>(null);

	// "Estructura" (posición, tamaño, estilo) se bloquea cuando la plantilla
	// tiene positionLocked. Si además el elemento tiene locked=true, ni
	// siquiera el contenido queda editable.
	const structureDisabled = positionLocked;
	const contentDisabled = positionLocked && Boolean(element?.locked);
	
	useEffect(() => {
		if (!element || contentDisabled || !focusContentRequest) {
			return;
		}

		contentRef.current?.focus();
		contentRef.current?.select();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [focusContentRequest, contentDisabled]);

	

	if (!selectedElementId || !element) {
		return (
			<div className='w-70 border-l border-app-border p-4'>
				<p className='text-sm text-app-text-muted'>Selecciona un elemento para editar sus propiedades.</p>
			</div>
		);
	}

	const update = (changes: ElementPatch) => updateElement(element.id, changes);

	return (
		<div className='w-70 space-y-4 overflow-y-auto border-l border-app-border p-4 thin-scrollbar'>
			<p className='text-xs font-medium uppercase text-app-text-muted'>
				{element.type === 'text' ? 'Texto' : element.type === 'barcode' ? 'Código de barras' : 'Código QR'}
			</p>

			{contentDisabled && (
				<p className='rounded-md border border-app-border bg-app-surface p-2 text-xs text-app-text-muted'>
					Este elemento está bloqueado en esta plantilla.
				</p>
			)}

			<fieldset
				disabled={structureDisabled}
				className='space-y-2 disabled:opacity-50'
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

				<Field label='Rotación'>
					<select
						value={element.rotation}
						onChange={(e) =>
							update({
								rotation: Number(e.target.value) as Rotation,
							})
						}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
					>
						{[0, 90, 180, 270].map((rotation) => (
							<option
								key={rotation}
								value={rotation}
							>
								{rotation}°
							</option>
						))}
					</select>
				</Field>
			</fieldset>

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
		</div>
	);
}
