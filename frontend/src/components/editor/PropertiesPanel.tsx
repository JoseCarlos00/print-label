import type { BarcodeElement, QrElement, Symbology, TextAlign, TextElement } from 'shared';
import type { ElementPatch } from '../../store/editorStore.types';
import { useEditorStore } from '../../store/useEditorStore';

const SYMBOLOGIES: Symbology[] = ['code128', 'ean13', 'code39', 'upc'];
const TEXT_ALIGNS: TextAlign[] = ['L', 'C', 'R', 'J'];

export function PropertiesPanel() {
	const positionLocked = useEditorStore((s) => s.positionLocked);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const element = useEditorStore((s) => s.elements.find((el) => el.id === s.selectedElementId));
	const updateElement = useEditorStore((s) => s.updateElement);

	if (!selectedElementId || !element) {
		return (
			<div className='w-72 border-l border-app-border p-4'>
				<p className='text-sm text-app-text-muted'>Selecciona un elemento para editar sus propiedades.</p>
			</div>
		);
	}

	// "Estructura" (posición, tamaño, estilo) se bloquea cuando la plantilla
	// tiene positionLocked. Si además el elemento tiene locked=true, ni
	// siquiera el contenido queda editable.
	const structureDisabled = positionLocked;
	const contentDisabled = positionLocked && Boolean(element.locked);

	const update = (changes: ElementPatch) => updateElement(element.id, changes);

	return (
		<div className='w-72 space-y-4 overflow-y-auto border-l border-app-border p-4'>
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

function TextFields({
	element,
	onChange,
}: {
	element: TextElement;
	onChange: (changes: Partial<TextElement>) => void;
}) {
	return (
		<>
			<label className='block text-xs text-app-text-muted'>
				Tamaño de fuente (mm)
				<input
					type='number'
					value={element.fontSize}
					onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</label>
			<label className='flex items-center gap-2 text-xs text-app-text-muted'>
				<input
					type='checkbox'
					checked={element.bold}
					onChange={(e) => onChange({ bold: e.target.checked })}
				/>
				Negrita
			</label>
			<label className='block text-xs text-app-text-muted'>
				Ancho de ajuste (mm, opcional)
				<input
					type='number'
					value={element.wrapWidth ?? ''}
					onChange={(e) => onChange({ wrapWidth: e.target.value ? Number(e.target.value) : undefined })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</label>
			{element.wrapWidth !== undefined && (
				<label className='block text-xs text-app-text-muted'>
					Alineación
					<select
						value={element.textAlign ?? 'L'}
						onChange={(e) => onChange({ textAlign: e.target.value as TextAlign })}
						className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
					>
						{TEXT_ALIGNS.map((a) => (
							<option
								key={a}
								value={a}
							>
								{a}
							</option>
						))}
					</select>
				</label>
			)}
		</>
	);
}

function BarcodeFields({
	element,
	onChange,
}: {
	element: BarcodeElement;
	onChange: (changes: Partial<BarcodeElement>) => void;
}) {
	return (
		<>
			<label className='block text-xs text-app-text-muted'>
				Simbología
				<select
					value={element.symbology}
					onChange={(e) => onChange({ symbology: e.target.value as Symbology })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				>
					{SYMBOLOGIES.map((s) => (
						<option
							key={s}
							value={s}
						>
							{s}
						</option>
					))}
				</select>
			</label>
			<label className='block text-xs text-app-text-muted'>
				Altura (mm)
				<input
					type='number'
					value={element.height}
					onChange={(e) => onChange({ height: Number(e.target.value) })}
					className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
				/>
			</label>
			<label className='flex items-center gap-2 text-xs text-app-text-muted'>
				<input
					type='checkbox'
					checked={element.showText}
					onChange={(e) => onChange({ showText: e.target.checked })}
				/>
				Mostrar texto legible
			</label>
		</>
	);
}

function QrFields({ element, onChange }: { element: QrElement; onChange: (changes: Partial<QrElement>) => void }) {
	return (
		<label className='block text-xs text-app-text-muted'>
			Tamaño (factor)
			<input
				type='number'
				min={1}
				value={element.size}
				onChange={(e) => onChange({ size: Number(e.target.value) })}
				className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
			/>
		</label>
	);
}
