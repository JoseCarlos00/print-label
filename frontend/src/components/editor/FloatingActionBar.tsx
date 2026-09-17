import { useStore } from 'zustand';
import { Undo2, Redo2, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Separator } from '@/components/ui/separator';

export function FloatingActionBar() {
	const clearElements = useEditorStore((s) => s.clearElements);
	const elementsCount = useEditorStore((s) => s.elements.length);
	const positionLocked = useEditorStore((s) => s.positionLocked);

	const pastStates = useStore(useEditorStore.temporal, (s) => s.pastStates);
	const futureStates = useStore(useEditorStore.temporal, (s) => s.futureStates);

	const canUndo = pastStates.length > 0;
	const canRedo = futureStates.length > 0;

	return (
		<div className='fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-app-border bg-app-surface p-1 shadow-lg'>
			<button
				type='button'
				title='Deshacer (Ctrl+Z)'
				disabled={!canUndo}
				onClick={() => useEditorStore.temporal.getState().undo()}
				className='flex size-8 items-center justify-center rounded-md text-app-text-muted enabled:cursor-pointer enabled:hover:bg-app-border enabled:hover:text-app-text disabled:opacity-40'
			>
				<Undo2 className='size-4' />
			</button>

			<button
				type='button'
				title='Rehacer (Ctrl+Y)'
				disabled={!canRedo}
				onClick={() => useEditorStore.temporal.getState().redo()}
				className='flex size-8 items-center justify-center rounded-md text-app-text-muted enabled:cursor-pointer enabled:hover:bg-app-border enabled:hover:text-app-text disabled:opacity-40'
			>
				<Redo2 className='size-4' />
			</button>

			<Separator
				orientation='vertical'
				className='mx-1 h-5'
			/>

			<button
				type='button'
				title='Limpiar lienzo'
				disabled={elementsCount === 0 || positionLocked}
				onClick={clearElements}
				className='flex size-8 items-center justify-center rounded-md text-app-text-muted enabled:cursor-pointer enabled:hover:bg-red-950 enabled:hover:text-red-400 disabled:opacity-40'
			>
				<Trash2 className='size-4' />
			</button>

			{/* Hueco para el próximo grupo: zoom, alinear, etc. */}
		</div>
	);
}
