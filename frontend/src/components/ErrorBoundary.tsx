import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-navy-200 p-8 max-w-md text-center">
            <h1 className="text-xl font-semibold text-navy-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-navy-500 mb-6">
              An unexpected error occurred. Please try returning to the dashboard.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-2.5 bg-navy-800 text-white rounded-lg font-medium hover:bg-navy-700 transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
