import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import { v4 as uuidv4 } from 'uuid';
import type { LabelElement, Rotation, Template } from 'shared';
import { createDefaultElement } from '@/config/elementDefaults';
import type { EditorState, EditorStore } from './editorStore.types';
import { removePrinterId, savePrinterId } from '@/utils/printerPreference';

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

// Lo que realmente trackea el historial: solo `elements` (ver `partialize`
// más abajo). Lo tipamos acá para no repetirlo.
type HistorySlice = Pick<EditorStore, 'elements'>;

// zundo agrega `.temporal` al store vía module augmentation — en este
// proyecto (moduleResolution "bundler" + customConditions "browser") la
// inferencia automática no lo encuentra, así que lo tipamos a mano.
// Es seguro: en runtime `temporal` SIEMPRE agrega esta propiedad.
type EditorStoreWithTemporal = UseBoundStore<StoreApi<EditorStore>> & {
	temporal: StoreApi<TemporalState<HistorySlice>>;
};

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
	isPublic: true,
	positionLocked: false,
	loadedTemplateState: null,
	profile: null,
	elements: [],
	selectedElementId: null,
	focusContentRequest: 0,
	clipboardElement: null,
	isDirty: false,
};

export const useEditorStore = create<EditorStore>()(
	temporal(
		(set, get) => ({
			...initialState,

			setProfile: (profile) => {
				if (profile) {
					savePrinterId(profile.id);
				} else {
					removePrinterId();
				}
				set({ profile });
			},

			addElement: (elementType) => {
				const element = createDefaultElement(elementType, get().elements.length);
				set((state) => ({
					elements: [...state.elements, element],
					selectedElementId: element.id,
					focusContentRequest: state.focusContentRequest + 1,
				}));
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
					id: uuidv4(),
					x: original.x + 5,
					y: original.y + 5,
					locked: false,
				};
				set((state) => ({
					elements: [...state.elements, copy],
					selectedElementId: copy.id,
					focusContentRequest: state.focusContentRequest + 1,
				}));
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

			// Vacía SOLO los elementos del lienzo — a diferencia de resetEditor(),
			// mantiene perfil, nombre de plantilla, positionLocked, etc.
			// Es una acción atómica (un click), no necesita transacción propia:
			// queda grabada como una entrada normal del historial.
			clearElements: () =>
				set({
					elements: [],
					selectedElementId: null,
				}),

			selectElement: (id) => set({ selectedElementId: id }),

			setTemplateMeta: (meta) => set(meta),

			loadTemplate: (template: Template) =>
				set({
					templateId: template.id,
					templateName: template.name,
					isPublic: template.public,
					positionLocked: template.positionLocked,
					loadedTemplateState: template.state,
					elements: template.elements,
					selectedElementId: null,
				}),

			resetEditor: () => set(initialState),

			requestContentFocus: () => {
				set((state) => ({
					focusContentRequest: state.focusContentRequest + 1,
				}));
			},

			copyElement: (id) => {
				const element = get().elements.find((el) => el.id === id);
				if (!element) return;
				set({ clipboardElement: structuredClone(element) });
			},

			pasteElement: () => {
				const clipboardElement = get().clipboardElement;
				if (!clipboardElement) return;

				const element = {
					...structuredClone(clipboardElement),
					id: uuidv4(),
					x: clipboardElement.x + 5,
					y: clipboardElement.y + 5,
					locked: false,
				};

				set((state) => ({
					elements: [...state.elements, element],
					selectedElementId: element.id,
					focusContentRequest: state.focusContentRequest + 1,
				}));
			},
		}),

		{
			partialize: (state) => ({ elements: state.elements }),
			equality: (past, current) => past.elements === current.elements,
			limit: 100,
		},
	),
) as EditorStoreWithTemporal;
