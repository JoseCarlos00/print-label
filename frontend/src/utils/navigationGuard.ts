import { useEditorStore } from '../store/useEditorStore';

const CONFIRM_MESSAGE = 'Vas a perder el diseño actual sin guardar. ¿Continuar?';

/**
 * Chequeo síncrono a llamar antes de CUALQUIER navegación que resetee el
 * editor (cambiar de plantilla, ir a la Galería, "Editor nuevo", logout).
 * No es un hook: lee el store directo con getState() para poder usarse
 * dentro de cualquier event handler (onClick) sin duplicar la lógica de
 * confirmación en cada componente.
 */
export function confirmLeaveEditor(): boolean {
	const { isDirty } = useEditorStore.getState();
	if (!isDirty) return true;
	return window.confirm(CONFIRM_MESSAGE);
}
