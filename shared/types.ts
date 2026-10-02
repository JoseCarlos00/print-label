// Tipos compartidos entre frontend (editor) y backend (validación + generación ZPL).
// Todas las posiciones y dimensiones físicas se guardan en milímetros (mm),
// nunca en píxeles. Los píxeles solo existen como detalle visual del editor
// y se calculan a partir de mm + una escala de pantalla, nunca se persisten.

/**
 * ZPL solo soporta 4 orientaciones fijas por comando (^A, ^BC, ^BQ).
 * No existe rotación libre en la impresora, por lo que el editor debe
 * restringir la rotación a estos 4 valores.
 */
export type Rotation = 0 | 90 | 180 | 270;

/**
 * Campos comunes a cualquier elemento colocado en el área de impresión.
 */
interface BaseElement {
	id: string;
	x: number; // mm, desde la esquina superior izquierda del área
	y: number; // mm, desde la esquina superior izquierda del área
	rotation: Rotation;
	positionLocked?: boolean;
	locked?: boolean;
}

export type TextAlign = 'Left' | 'Center' | 'Right' | 'Justify';

export interface TextElement extends BaseElement {
	type: 'text';
	content: string;
	fontSize: number; // mm de alto de carácter
	bold: boolean;
	wrapWidth?: number; // mm; si está presente, activa ^FB con este ancho (texto multilínea)
	textAlign?: TextAlign; // default "Left" si wrapWidth está presente pero textAlign no
	lineSpacing?: number; // mm extra entre líneas; default 0
}

export type Symbology = 'code128' | 'ean13';

export interface BarcodeElement extends BaseElement {
	type: 'barcode';
	content: string;
	symbology: Symbology;
	width: number; // mm
	height: number; // mm
	lockAspectRatio: boolean;
	showText: boolean; // imprime el número legible debajo del código
	fontSize?: number; // mm; tamaño del texto legible, automático según height si se omite
}

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QrLabel {
	/** Si es undefined, se muestra element.content directo (mismo texto que codifica el QR) */
	customText?: string;
	fontSize: number; // mm
	visible: boolean;
	wrapWidth?: number; // mm
}

export interface QrElement extends BaseElement {
	type: 'qr';
	content: string;
	size: number; // tamaño deseado del QR en mm
	label: QrLabel;
}

export interface ImageElement extends BaseElement {
	type: 'image';

	/**
	 * Imagen normalizada almacenada como data URL.
	 * El contenido se rasteriza a la resolución necesaria por el editor
	 * y se persiste junto con la plantilla.
	 */
	src: string;

	lockAspectRatio: boolean;
	width: number; // mm
	height: number; // mm
}

export type ShapeType = 'rectangle' | 'line' | 'ellipse';

export interface ShapeElement extends BaseElement {
	type: 'shape';
	shape: ShapeType;

	width: number; // mm
	height: number; // mm

	strokeWidth: number; // mm
	filled: boolean;

	radius?: number; // mm; solo rectangle
}

/**
 * Unión discriminada por "tipo": el editor y el conversor de ZPL
 * usan este campo para saber qué propiedades esperar.
 */
export type LabelElement = TextElement | BarcodeElement | QrElement | ImageElement | ShapeElement;

/**
 * Perfil de una impresora física: sus dimensiones, resolución y
 * dirección de red. El DPI es el dato crítico para convertir
 * mm -> dots al generar el ZPL.
 */
export interface PrinterProfile {
	id: string;
	name: string;
	label: string;
	widthMm: number;
	heightMm: number;
	dpi: number; // típicamente 203 o 300 en impresoras Zebra
	ip: string;
}

export type StateTemplate = 'pending' | 'approved' | 'rejected';

/**
 * Una plantilla guardada: el diseño completo listo para reabrir en
 * el editor o para reimprimir.
 */
export interface Template {
	id: string;
	name: string;
	profileId: string;
	elements: LabelElement[];
	state: StateTemplate;
	public: boolean;
	requestedBy?: string | null;
	createOn: string; // ISO 8601
	updateOn: string; // ISO 8601
}

/**
 * Payload para crear una plantilla, ya sea vía staging (usuario libre)
 * o directo (admin). El backend decide el "state" según la ruta/auth,
 * no el cliente.
 */
export interface CreateTemplateInput {
	name: string;
	profileId: string;
	elements: LabelElement[];
	public: boolean;
	requestedBy?: string;
}

export interface UpdateTemplateInput {
	name: string;
	profileId: string;
	elements: LabelElement[];
	public: boolean;
}
