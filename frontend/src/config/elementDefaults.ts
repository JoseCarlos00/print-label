import { v4 as uuidv4 } from 'uuid';
import type { ImageElement, LabelElement, QrLabel, ShapeElement, ShapeType } from 'shared';
import type { ElementType } from '@/store/editorStore.types';

export function createDefaultElement(type: ElementType, index: number): LabelElement {
	// offset simple para que los elementos nuevos no queden todos apilados
	const base = {
		id: uuidv4(),
		x: 10 + index * 3,
		y: 10 + index * 3,
		rotation: 0 as const,
		locked: false,
	};

	const baseQrLabel: QrLabel = {
		fontSize: 8,
		visible: true,
	};

	switch (type) {
		case 'text':
			return { ...base, type: 'text', content: 'Texto', fontSize: 10, bold: false };
		case 'barcode':
			return {
				...base,
				type: 'barcode',
				content: '123456789012',
				symbology: 'code128',
				width: 50,
				height: 25,
				showText: true,
				lockAspectRatio: true,
			};
		case 'qr':
			return { ...base, type: 'qr', content: 'https://', size: 35, label: baseQrLabel };
	}
}

const DEFAULT_IMAGE_WIDTH_MM = 40;

export function createImageElement(src: string, widthPx: number, heightPx: number, index: number): ImageElement {
	const width = DEFAULT_IMAGE_WIDTH_MM;
	const height = width * (heightPx / widthPx);

	return {
		id: uuidv4(),
		x: 10 + index * 3,
		y: 10 + index * 3,
		rotation: 0,
		locked: false,
		type: 'image',
		src,
		width,
		height,
		lockAspectRatio: true,
	};
}

export function createShapeElement(shape: ShapeType, index: number): ShapeElement {
	const base = {
		id: uuidv4(),
		x: 10 + index * 3,
		y: 10 + index * 3,
		rotation: 0 as const,
		locked: false,
	};

	switch (shape) {
		case 'rectangle':
			return {
				...base,
				type: 'shape',
				shape,
				width: 50,
				height: 25,
				strokeWidth: 1,
				filled: false,
				radius: 0,
			};

		case 'line':
			return {
				...base,
				type: 'shape',
				shape,
				width: 50,
				height: 1,
				strokeWidth: 1,
				filled: false,
			};

		case 'ellipse':
			return {
				...base,
				type: 'shape',
				shape,
				width: 30,
				height: 30,
				strokeWidth: 1,
				filled: false,
			};
	}
}
