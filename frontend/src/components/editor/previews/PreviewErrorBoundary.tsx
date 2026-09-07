import { Component, type ReactNode } from 'react';

interface Props {
	fallback: ReactNode;
	children: ReactNode;
}

// jsbarcode (via react-barcode) lanza una excepción de render si el
// contenido no cumple el formato del symbology (ej. EAN13 con letras).
// Sin este boundary, un contenido inválido tira abajo TODO el canvas,
// no solo ese elemento — y va a pasar seguido mientras el usuario escribe.
export class PreviewErrorBoundary extends Component<Props, { hasError: boolean }> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	render() {
		return this.state.hasError ? this.props.fallback : this.props.children;
	}
}
