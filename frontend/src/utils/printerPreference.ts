const STORAGE_KEY = 'printLabel:lastPrinterId';

export function getSavedPrinterId(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

export function savePrinterId(id: string): void {
	try {
		localStorage.setItem(STORAGE_KEY, id);
	} catch {
		// no-op: si falla, simplemente no persiste la preferencia
	}
}
