import { Component, type ReactNode } from 'react';
import { InvalidPreview } from './InvalidPreview'

interface Props {
	fallback?: ReactNode;
	children: ReactNode;
}

export class PreviewErrorBoundary extends Component<Props, { hasError: boolean }> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	render() {
		if (!this.state.hasError) {
			return this.props.children;
		}

		return this.props.fallback ?? <InvalidPreview />;
	}
}
