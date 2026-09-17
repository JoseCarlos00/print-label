import { useEditorStore } from './useEditorStore';
import type { LabelElement } from 'shared';

// Coordina que una interacción "continua" (arrastrar, escribir, mantener
// apretado el stepper) genere UNA sola entrada en el historial, en vez de
// una por cada updateElement() intermedio.
//
// Usa un CONTADOR en vez de un booleano a propósito: si dos transacciones
// se solapan (ej. estás con foco en un NumberField y sin blurear todavía
// arrastrás otro elemento), la pausa real de zundo solo se levanta cuando
// se cierra la ÚLTIMA transacción abierta — así ambos cambios quedan
// agrupados en una sola entrada, en vez de que la segunda interacción
// quede grabando de a un paso por window de tiempo sin querer.
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
	if (openTransactions === 0) return; // commit sin begin correspondiente, ignorar
	openTransactions--;
	if (openTransactions > 0) return; // todavía hay otra transacción abierta, esperar

	const before = snapshotBeforeTransaction;
	snapshotBeforeTransaction = null;
	useEditorStore.temporal.getState().resume();

	if (!before) return;

	const after = useEditorStore.getState().elements;
	if (before === after) return; // no hubo ningún updateElement de por medio

	useEditorStore.temporal.setState((state) => ({
		pastStates: [...state.pastStates, { elements: before }],
		futureStates: [],
	}));
}
