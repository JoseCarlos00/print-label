import { Component, type ReactNode } from 'react';
import { ZplValidationError } from 'shared/zpl';
import { InvalidPreview } from './InvalidPreview';

interface Props {
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
	error: Error | null;
}

export class PreviewErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false, error: null };

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidUpdate(prevProps: Props) {
		if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
			this.setState({ hasError: false, error: null });
		}
	}

	render() {
		if (!this.state.hasError) {
			return this.props.children;
		}

		if (this.state.error instanceof ZplValidationError) {
			return <InvalidPreview message={this.state.error.message} />;
		}

		return <InvalidPreview />;
	}
}
