import { create } from 'zustand';

// Cualquier componente que mute plantillas (crear, actualizar, aprobar,
// rechazar, eliminar) llama a bumpTemplatesVersion(). Cualquier
// useTemplates() en otra rama del árbol —que no tiene forma de
// enterarse por props— lo tiene como dependencia y refetchea solo.
interface TemplatesCacheState {
	version: number;
	bump: () => void;
}

const useTemplatesCacheStore = create<TemplatesCacheState>((set) => ({
	version: 0,
	bump: () => set((state) => ({ version: state.version + 1 })),
}));

export function bumpTemplatesVersion(): void {
	useTemplatesCacheStore.getState().bump();
}

export function useTemplatesVersion(): number {
	return useTemplatesCacheStore((s) => s.version);
}
