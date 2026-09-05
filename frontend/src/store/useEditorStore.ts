import { create } from 'zustand';
import type { LabelElement, PrinterProfile, Rotation, Template } from 'shared';
import { createDefaultElement } from '../utils/elementDefaults';
import type { EditorState, EditorStore } from './editorStore.types';
import { savePrinterId } from '../utils/printerPreference'

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

/*
 *  Canvas.tsx — solo re-renderiza si cambian elements o selectedElementId
 *  const elements = useEditorStore((s) => s.elements);
 *  const selectedElementId = useEditorStore((s) => s.selectedElementId);
 *  const selectElement = useEditorStore((s) => s.selectElement);
 *  
 *  PropertiesPanel.tsx — solo re-renderiza si cambia el elemento seleccionado
 *  const selected = useEditorStore((s) => s.elements.find((el) => el.id === s.selectedElementId));
 *  const updateElement = useEditorStore((s) => s.updateElement);
 * 
 * Y para lugares que necesitan leer todo el estado de una sola vez 
 * sin suscribirse a re-renders 
 * (por ejemplo, al armar el body del POST /api/templates dentro de SaveTemplateModal),
 * usás useEditorStore.getState() directo, sin el hook:
 * `const { templateName, isPublic, positionLocked, profile, elements } = useEditorStore.getState();`
 * */


const initialState: EditorState = {
	templateId: null,
	templateName: '',
	isPublic: false,
	positionLocked: false,
	loadedTemplateState: null,
	profile: null,
	elements: [],
	selectedElementId: null,
};

export const useEditorStore = create<EditorStore>()((set, get) => ({
	...initialState,

	setProfile: (profile) => {
		savePrinterId(profile.id);
		set({ profile });
	},

	addElement: (elementType) => {
		const element = createDefaultElement(elementType, get().elements.length);
		set((state) => ({ elements: [...state.elements, element], selectedElementId: element.id }));
	},

	updateElement: (id, changes) =>
		set((state) => ({
			elements: state.elements.map((el) => (el.id === id ? ({ ...el, ...changes } as LabelElement) : el)),
		})),

	removeElement: (id) =>
		set((state) => ({
			elements: state.elements.filter((el) => el.id !== id),
			selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
		})),

	duplicateElement: (id) => {
		const original = get().elements.find((el) => el.id === id);
		if (!original) return;

		const copy: LabelElement = {
			...original,
			id: crypto.randomUUID(),
			x: original.x + 5,
			y: original.y + 5,
			locked: false,
		};
		set((state) => ({ elements: [...state.elements, copy], selectedElementId: copy.id }));
	},

	rotateElement: (id) =>
		set((state) => ({
			elements: state.elements.map((el) => {
				if (el.id !== id) return el;
				const next = ROTATIONS[(ROTATIONS.indexOf(el.rotation) + 1) % ROTATIONS.length]!;
				return { ...el, rotation: next };
			}),
		})),

	toggleElementLock: (id) =>
		set((state) => ({
			elements: state.elements.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el)),
		})),

	selectElement: (id) => set({ selectedElementId: id }),

	setTemplateMeta: (meta) => set(meta),

	loadTemplate: (template: Template, profile: PrinterProfile) =>
		set({
			templateId: template.id,
			templateName: template.name,
			isPublic: template.public,
			positionLocked: template.positionLocked,
			loadedTemplateState: template.state,
			profile,
			elements: template.elements,
			selectedElementId: null,
		}),

	resetEditor: () => set(initialState),
}));
