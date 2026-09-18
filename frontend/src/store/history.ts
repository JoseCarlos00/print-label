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

export function clearHistory(): void {
  useEditorStore.temporal.getState().clear();
}
