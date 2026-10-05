import React, { Component } from 'react';
import Button from './Button.jsx';
import { AlertOctagon, RotateCcw, Home, Sparkles, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleHome = () => {
    window.location.href = '/';
  };

  handleCopy = () => {
    const { error, errorInfo } = this.state;
    const text = `Error: ${error?.message || error}\n\nComponent Stack:\n${errorInfo?.componentStack || 'N/A'}\n\nStack:\n${error?.stack || 'N/A'}`;
    navigator.clipboard?.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, copied } = this.state;

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-text">
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/90 shadow-soft p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Ambient luxury accent pill */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full inline-block mb-3">
              Application Notice
            </span>

            <h2 className="text-xl font-display font-bold text-stone-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed">
              An unexpected issue occurred while displaying this section. You can try refreshing or resetting the view.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
              <Button
                variant="primary"
                size="sm"
                icon={RotateCcw}
                onClick={this.handleReload}
                className="w-full sm:w-auto text-xs px-4"
              >
                Reload Page
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={this.handleReset}
                className="w-full sm:w-auto text-xs px-4"
              >
                Try Again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Home}
                onClick={this.handleHome}
                className="w-full sm:w-auto text-xs text-stone-500 hover:text-stone-800"
              >
                Home
              </Button>
            </div>

            {/* Developer technical details accordion */}
            {error && (
              <div className="mt-4 pt-3 border-t border-stone-100 text-left">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="w-full flex items-center justify-between text-[11px] text-stone-400 hover:text-stone-600 transition-colors py-1 cursor-pointer font-mono"
                >
                  <span>Diagnostic Info</span>
                  {showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showDetails && (
                  <div className="mt-2 p-2.5 rounded-xl bg-stone-900 text-[10px] font-mono text-stone-300 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-800 text-[10px]">
                      <span className="text-rose-400 font-bold truncate max-w-[200px]">
                        {error.message || String(error)}
                      </span>
                      <button
                        type="button"
                        onClick={this.handleCopy}
                        className="text-gold-400 hover:text-gold-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    {error.stack && (
                      <pre className="text-stone-400 max-h-32 overflow-x-auto whitespace-pre-wrap scrollbar-thin">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
