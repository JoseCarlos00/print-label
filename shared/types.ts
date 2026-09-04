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
}

export type TextAlign = "L" | "C" | "R" | "J"; // izquierda, centro, derecha, justificado — valores nativos de ^FB

export interface TextElement extends BaseElement {
	type: 'text';
	content: string;
	fontSize: number; // mm de alto de carácter
	bold: boolean;
	wrapWidth?: number; // mm; si está presente, activa ^FB con este ancho (texto multilínea)
	textAlign?: TextAlign; // default "L" si wrapWidth está presente pero textAlign no
	lineSpacing?: number; // mm extra entre líneas; default 0
}

export type Symbology = "code128" | "ean13" | "code39" | "upc";

export interface BarcodeElement extends BaseElement {
  type: "barcode";
  content: string;
  symbology: Symbology;
  height: number; // mm
  showText: boolean; // imprime el número legible debajo del código
}

export type QrErrorCorrection = "L" | "M" | "Q" | "H";
export type LabelPosition = "above" | "below";

export interface QrElement extends BaseElement {
  type: "qr";
  content: string;
  size: number; // factor de magnificación ZPL (entero positivo)
  errorCorrection?: QrErrorCorrection; // por defecto "M" si no se especifica
}

/**
 * Unión discriminada por "tipo": el editor y el conversor de ZPL
 * usan este campo para saber qué propiedades esperar.
 */
export type LabelElement = TextElement | BarcodeElement | QrElement;

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
	byRequest?: string;
	positionLocked: boolean; // true = el frontend no permite mover elementos (x,y fijos); el contenido sí se puede editar
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
	byRequest?: string;
	positionLocked?: boolean; // opcional, default false si no se envía
}
 