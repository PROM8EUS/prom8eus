import React from 'react';

type ErrorBoundaryState = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Minimal logging; can be extended to a logging sink later
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border rounded-md bg-red-50 text-red-700">
          <div className="font-semibold mb-2">Something went wrong.</div>
          <div className="text-sm">Please try refreshing the page or navigating back.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


