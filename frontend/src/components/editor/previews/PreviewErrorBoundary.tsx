import { Component, type ReactNode } from 'react';
import { InvalidPreview } from './InvalidPreview';

interface Props {
	fallback?: ReactNode;
	children: ReactNode;
	/**
	 * Cuando este valor cambia de referencia, el boundary vuelve a
	 * intentar renderizar los children (sale del estado de error). Sin
	 * esto, una vez que React captura un error acá, el fallback queda
	 * pegado para siempre — React no vuelve a intentar solo, aunque el
	 * contenido que causó el error ya haya sido corregido.
	 */
	resetKey?: unknown;
}

interface State {
	hasError: boolean;
}

export class PreviewErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidUpdate(prevProps: Props) {
		if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
			this.setState({ hasError: false });
		}
	}

	render() {
		if (!this.state.hasError) {
			return this.props.children;
		}

		return this.props.fallback ?? <InvalidPreview />;
	}
}
