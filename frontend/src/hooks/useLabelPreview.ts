import { useCallback, useRef, useState } from 'react';
import type { LabelElement, PrinterProfile } from 'shared';
import { generateZpl, ZplValidationError } from 'shared/zpl';
import { renderZplToImage } from '../services/labelary';

interface UseLabelPreviewResult {
	imageUrl: string | null;
	loading: boolean;
	error: string | null;
	/** true si elements/profile cambiaron desde la última vez que se generó la imagen */
	isStale: boolean;
	redraw: () => void;
}

export function useLabelPreview(elements: LabelElement[], profile: PrinterProfile | null): UseLabelPreviewResult {
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [renderedKey, setRenderedKey] = useState<string | null>(null);
	const lastUrlRef = useRef<string | null>(null);

	// Snapshot de "qué se ve en la imagen actual" vs "qué hay ahora en el
	// store" — sirve solo para marcar visualmente que hay cambios sin
	// aplicar, no dispara ningún fetch por sí solo.
	const currentKey = profile ? JSON.stringify({ profile, elements }) : null;
	const isStale = renderedKey !== null && renderedKey !== currentKey;

	const redraw = useCallback(() => {
		if (!profile || elements.length === 0) return;

		setLoading(true);
		setError(null);

		(async () => {
			try {
      const zpl = generateZpl(elements, profile, 'preview');
      
				const nextUrl = await renderZplToImage(zpl, profile);

				if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
				lastUrlRef.current = nextUrl;
				
				setImageUrl(nextUrl);
				setRenderedKey(currentKey);
			} catch (err) {
				setError(
					err instanceof ZplValidationError
						? err.message
						: 'No se pudo generar la vista previa (revisa tu conexión a internet)',
				);
			} finally {
				setLoading(false);
			}
		})();
	}, [elements, profile, currentKey]);

	return { imageUrl, loading, error, isStale, redraw };
}
