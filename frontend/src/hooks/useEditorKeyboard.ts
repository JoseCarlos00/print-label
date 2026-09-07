import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

function isTextInput(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	return (
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.tagName === 'SELECT' ||
		target.isContentEditable
	);
}

export function useEditorKeyboard() {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
      
			// No ejecutar shortcuts mientras el usuario escribe.
			if (isTextInput(e.target)) {
				return;
			}

			const state = useEditorStore.getState();

			const {
				selectedElementId,
				positionLocked,
				elements,
				selectElement,
				updateElement,
				duplicateElement,
				removeElement,
				rotateElement,
			} = state;

			if (!selectedElementId) {
				return;
			}

			const element = elements.find((el) => el.id === selectedElementId);

			if (!element) {
				return;
			}

			// Escape
			if (e.key === 'Escape') {
				selectElement(null);
				return;
			}

			// Si la posición está bloqueada, no permitimos
			// mover, rotar, duplicar ni eliminar.
			if (positionLocked) {
				return;
			}

			// Delete
			if (e.key === 'Delete') {
				e.preventDefault();
				removeElement(selectedElementId);
				return;
			}

			// Ctrl/Cmd + D
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
				e.preventDefault();
				duplicateElement(selectedElementId);
				return;
			}

			// R
			if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'r') {
				e.preventDefault();
				rotateElement(selectedElementId);
				return;
			}

			// Movimiento
			const step = e.shiftKey ? 1 : 0.1;

			switch (e.key) {
				case 'ArrowUp':
					e.preventDefault();
					updateElement(element.id, {
						y: element.y - step,
					});
					break;

				case 'ArrowDown':
					e.preventDefault();
					updateElement(element.id, {
						y: element.y + step,
					});
					break;

				case 'ArrowLeft':
					e.preventDefault();
					updateElement(element.id, {
						x: element.x - step,
					});
					break;

				case 'ArrowRight':
					e.preventDefault();
					updateElement(element.id, {
						x: element.x + step,
					});
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);
}
