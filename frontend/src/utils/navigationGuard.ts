import { isEditorDirty } from '@/store/history';

const CONFIRM_MESSAGE = 'Vas a perder el diseño actual sin guardar. ¿Continuar?';

export function confirmLeaveEditor(): boolean {
	if (!isEditorDirty()) return true;
	return window.confirm(CONFIRM_MESSAGE);
}
