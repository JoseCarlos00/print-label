import { useRef, type ChangeEvent } from 'react';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/toast';
import { useEditorStore } from '@/store/useEditorStore';
import { ALLOWED_IMAGE_TYPES, importImage } from '@/utils/imageImport';

const ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

export function useImageImport() {
	const inputRef = useRef<HTMLInputElement>(null);
	const addImageElement = useEditorStore((s) => s.addImageElement);

	const openPicker = () => {
		inputRef.current?.click();
	};

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		// Capturamos el input antes del await: después, event.currentTarget ya no es válido.
		const input = event.currentTarget;
		const file = input.files?.[0];

		if (!file) return;

		try {
			const { src, widthPx, heightPx } = await importImage(file);
			addImageElement(src, widthPx, heightPx);
		} catch (err) {
			toast.add({
				title: 'No se pudo importar la imagen',
				description: err instanceof Error && !(err instanceof ApiError) ? err.message : undefined,
				type: 'error',
			});
		} finally {
			// Permite volver a elegir el mismo archivo.
			input.value = '';
		}
	};

	return { inputRef, accept: ACCEPT, openPicker, handleFileChange };
}
