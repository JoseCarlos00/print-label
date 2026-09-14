import { useEffect, useRef } from 'react';
import type { ElementPatch } from '../../../store/editorStore.types';
import { useEditorStore } from '../../../store/useEditorStore';
import { QrFields } from './QrFields'
import { TextFields } from './TextFields'
import { BarcodeFields } from './BarcodeFields'


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
				<label className='block text-xs text-app-text-muted'>
					X (mm)
					<input
						type='number'
						value={element.x}
						onChange={(e) => update({ x: Number(e.target.value) })}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
					/>
				</label>

				<label className='block text-xs text-app-text-muted'>
					Y (mm)
					<input
						type='number'
						value={element.y}
						onChange={(e) => update({ y: Number(e.target.value) })}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
					/>
				</label>

				<label className='block text-xs text-app-text-muted'>
					Rotación
					<select
						value={element.rotation}
						onChange={(e) => update({ rotation: Number(e.target.value) as 0 | 90 | 180 | 270 })}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
					>
						{[0, 90, 180, 270].map((r) => (
							<option
								key={r}
								value={r}
							>
								{r}°
							</option>
						))}
					</select>
				</label>
			</fieldset>

			<fieldset
				disabled={contentDisabled}
				className='disabled:opacity-50'
			>
				<label className='block text-xs text-app-text-muted'>
					Contenido
					<textarea
						ref={contentRef}
						value={element.content}
						onChange={(e) => update({ content: e.target.value })}
						rows={2}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
					/>
				</label>
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
