import type { LabelElement } from 'shared';
import type { ElementType } from '../store/editorStore.types';

export function createDefaultElement(type: ElementType, index: number): LabelElement {
	// offset simple para que los elementos nuevos no queden todos apilados
	const base = { id: crypto.randomUUID(), x: 10 + index * 3, y: 10 + index * 3, rotation: 0 as const, locked: false };

	switch (type) {
		case 'text':
			return { ...base, type: 'text', content: 'Texto', fontSize: 5, bold: false };
		case 'barcode':
			return { ...base, type: 'barcode', content: '123456789012', symbology: 'code128', height: 15, showText: true };
		case 'qr':
			return { ...base, type: 'qr', content: 'https://', size: 4 };
	}
}
