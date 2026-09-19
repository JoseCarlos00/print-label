import { create, useStore } from 'zustand';
import { useEditorStore } from './useEditorStore';
import type { LabelElement } from 'shared';

let snapshotBeforeTransaction: LabelElement[] | null = null;
let openTransactions = 0;

export function beginHistoryTransaction(): void {
	if (openTransactions === 0) {
		snapshotBeforeTransaction = useEditorStore.getState().elements;
		useEditorStore.temporal.getState().pause();
	}
	openTransactions++;
}

export function commitHistoryTransaction(): void {
	if (openTransactions === 0) return;
	openTransactions--;
	if (openTransactions > 0) return;

	const before = snapshotBeforeTransaction;
	snapshotBeforeTransaction = null;
	useEditorStore.temporal.getState().resume();

	if (!before) return;

	const after = useEditorStore.getState().elements;
	if (before === after) return;

	useEditorStore.temporal.setState((state) => ({
		pastStates: [...state.pastStates, { elements: before }],
		futureStates: [],
	}));
}

// ── Seguimiento de "cambios sin guardar" ────────────────────────────────
//
// En vez de un booleano de mano (el viejo `isDirty`, que nadie ponía
// nunca en `true` — bug real que encontramos), derivamos "sucio"
// comparando la profundidad ACTUAL del historial de undo contra la
// profundidad que tenía en el último guardado exitoso. Beneficio extra:
// si el usuario deshace hasta volver exactamente al estado guardado,
// "sucio" vuelve a `false` solo.
const useSavedHistoryDepth = create<{ depth: number; setDepth: (n: number) => void }>((set) => ({
	depth: 0,
	setDepth: (depth) => set({ depth }),
}));

/** Llamar después de un guardado/actualización exitosa de la plantilla. */
export function markHistorySaved(): void {
	const currentDepth = useEditorStore.temporal.getState().pastStates.length;
	useSavedHistoryDepth.getState().setDepth(currentDepth);
}

/** Para usar fuera de React (handlers imperativos, como confirmLeaveEditor). */
export function isEditorDirty(): boolean {
	const pastDepth = useEditorStore.temporal.getState().pastStates.length;
	const savedDepth = useSavedHistoryDepth.getState().depth;
	return pastDepth !== savedDepth;
}

/** Hook reactivo, para componentes (ej. useUnsavedChangesGuard). */
export function useIsDirty(): boolean {
	const pastDepth = useStore(useEditorStore.temporal, (state) => state.pastStates.length);
	const savedDepth = useSavedHistoryDepth((state) => state.depth);
	return pastDepth !== savedDepth;
}

export function clearHistory(): void {
	snapshotBeforeTransaction = null;
	openTransactions = 0;

	useEditorStore.temporal.getState().resume();
	useEditorStore.temporal.getState().clear();
	useSavedHistoryDepth.getState().setDepth(0);
}
