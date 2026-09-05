import { useCallback, useReducer } from 'react';
import type { LabelElement, PrinterProfile, Rotation, Template } from 'shared';
import { createDefaultElement } from '../utils/elementDefaults';
import type { EditorState, EditorStore, ElementType } from './editorStore.types';

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

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

type Action =
	| { type: 'SET_PROFILE'; profile: PrinterProfile }
	| { type: 'ADD_ELEMENT'; elementType: ElementType }
	| { type: 'UPDATE_ELEMENT'; id: string; changes: Partial<LabelElement> }
	| { type: 'REMOVE_ELEMENT'; id: string }
	| { type: 'DUPLICATE_ELEMENT'; id: string }
	| { type: 'ROTATE_ELEMENT'; id: string }
	| { type: 'TOGGLE_LOCK'; id: string }
	| { type: 'SELECT_ELEMENT'; id: string | null }
	| { type: 'SET_META'; meta: Partial<Pick<EditorState, 'templateName' | 'isPublic' | 'positionLocked'>> }
	| { type: 'LOAD_TEMPLATE'; template: Template; profile: PrinterProfile }
	| { type: 'RESET' };

function reducer(state: EditorState, action: Action): EditorState {
	switch (action.type) {
		case 'SET_PROFILE':
			return { ...state, profile: action.profile };

		case 'ADD_ELEMENT': {
			const element = createDefaultElement(action.elementType, state.elements.length);
			return { ...state, elements: [...state.elements, element], selectedElementId: element.id };
		}

		case 'UPDATE_ELEMENT':
			return {
				...state,
				elements: state.elements.map((el) =>
					el.id === action.id ? ({ ...el, ...action.changes } as LabelElement) : el,
				),
			};

		case 'REMOVE_ELEMENT':
			return {
				...state,
				elements: state.elements.filter((el) => el.id !== action.id),
				selectedElementId: state.selectedElementId === action.id ? null : state.selectedElementId,
			};

		case 'DUPLICATE_ELEMENT': {
			const original = state.elements.find((el) => el.id === action.id);
			if (!original) return state;

			const copy: LabelElement = {
				...original,
				id: crypto.randomUUID(),
				x: original.x + 5,
				y: original.y + 5,
				locked: false,
			};
			return { ...state, elements: [...state.elements, copy], selectedElementId: copy.id };
		}

		case 'ROTATE_ELEMENT':
			return {
				...state,
				elements: state.elements.map((el) => {
					if (el.id !== action.id) return el;
					const next = ROTATIONS[(ROTATIONS.indexOf(el.rotation) + 1) % ROTATIONS.length]!;
					return { ...el, rotation: next };
				}),
			};

		case 'TOGGLE_LOCK':
			return {
				...state,
				elements: state.elements.map((el) => (el.id === action.id ? { ...el, locked: !el.locked } : el)),
			};

		case 'SELECT_ELEMENT':
			return { ...state, selectedElementId: action.id };

		case 'SET_META':
			return { ...state, ...action.meta };

		case 'LOAD_TEMPLATE':
			return {
				...state,
				templateId: action.template.id,
				templateName: action.template.name,
				isPublic: action.template.public,
				positionLocked: action.template.positionLocked,
				loadedTemplateState: action.template.state,
				profile: action.profile,
				elements: action.template.elements,
				selectedElementId: null,
			};

		case 'RESET':
			return initialState;

		default:
			return state;
	}
}

export function useEditorStore(): EditorStore {
	const [state, dispatch] = useReducer(reducer, initialState);

	// Cada acción envuelta en useCallback para que los componentes hijos
	// (Canvas, PropertiesPanel) no re-rendericen de más por referencias nuevas.
	const setProfile = useCallback((profile: PrinterProfile) => dispatch({ type: 'SET_PROFILE', profile }), []);
	const addElement = useCallback((elementType: ElementType) => dispatch({ type: 'ADD_ELEMENT', elementType }), []);
	const updateElement = useCallback(
		(id: string, changes: Partial<LabelElement>) => dispatch({ type: 'UPDATE_ELEMENT', id, changes }),
		[],
	);
	const removeElement = useCallback((id: string) => dispatch({ type: 'REMOVE_ELEMENT', id }), []);
	const duplicateElement = useCallback((id: string) => dispatch({ type: 'DUPLICATE_ELEMENT', id }), []);
	const rotateElement = useCallback((id: string) => dispatch({ type: 'ROTATE_ELEMENT', id }), []);
	const toggleElementLock = useCallback((id: string) => dispatch({ type: 'TOGGLE_LOCK', id }), []);
	const selectElement = useCallback((id: string | null) => dispatch({ type: 'SELECT_ELEMENT', id }), []);
	const setTemplateMeta: EditorStore['setTemplateMeta'] = useCallback(
		(meta) => dispatch({ type: 'SET_META', meta }),
		[],
	);
	const loadTemplate = useCallback(
		(template: Template, profile: PrinterProfile) => dispatch({ type: 'LOAD_TEMPLATE', template, profile }),
		[],
	);
	const resetEditor = useCallback(() => dispatch({ type: 'RESET' }), []);

	return {
		...state,
		setProfile,
		addElement,
		updateElement,
		removeElement,
		duplicateElement,
		rotateElement,
		toggleElementLock,
		selectElement,
		setTemplateMeta,
		loadTemplate,
		resetEditor,
	};
}
