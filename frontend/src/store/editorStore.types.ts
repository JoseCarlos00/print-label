import type { LabelElement, PrinterProfile, StateTemplate, Template } from 'shared';

export type ElementType = LabelElement['type'];

export interface EditorState {
	/** null = etiqueta nueva, no viene de ninguna plantilla existente */
	templateId: string | null;
	templateName: string;
	isPublic: boolean;
	/** viene de la plantilla cargada, o se define al guardar una nueva */
	positionLocked: boolean;
	/** state de la plantilla cargada (approved/pending/rejected); null si es nueva */
	loadedTemplateState: StateTemplate | null;
	profile: PrinterProfile | null;
	elements: LabelElement[];
	selectedElementId: string | null;
}

export interface EditorActions {
	setProfile: (profile: PrinterProfile) => void;
	addElement: (type: ElementType) => void;
	updateElement: (id: string, changes: Partial<LabelElement>) => void;
	removeElement: (id: string) => void;
	duplicateElement: (id: string) => void;
	rotateElement: (id: string) => void;
	toggleElementLock: (id: string) => void;
	selectElement: (id: string | null) => void;
	setTemplateMeta: (meta: Partial<Pick<EditorState, 'templateName' | 'isPublic' | 'positionLocked'>>) => void;
	loadTemplate: (template: Template, profile: PrinterProfile) => void;
	resetEditor: () => void;
}

export type EditorStore = EditorState & EditorActions;
