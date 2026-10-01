import React, { Component } from 'react';
import Button from './Button.jsx';
import { AlertOctagon } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
            <AlertOctagon className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-stone-500 max-w-md mb-6">
            An unexpected error occurred while rendering this component. You can try refreshing or resetting the view.
          </p>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button variant="primary" size="sm" onClick={this.handleReload}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
