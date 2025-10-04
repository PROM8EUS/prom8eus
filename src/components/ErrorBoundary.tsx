/**
 * Enhanced Error Boundary Component
 * Provides comprehensive error handling with fallback UI and error reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Home, 
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  className?: string;
  showRetryButton?: boolean;
  showDetailsButton?: boolean;
  showReportButton?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const { errorId } = this.state;

    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error ID:', errorId);
      console.groupEnd();
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo, errorId);
    }

    // Report error to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo, errorId);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          key !== prevProps.resetKeys?.[index]
        );
        
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // In a real application, you would send this to your error reporting service
    // For now, we'll just log it
    console.log('📊 Error Report:', {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: this.state.retryCount + 1,
      showDetails: false
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    const { 
      children, 
      fallback, 
      className,
      showRetryButton = true,
      showDetailsButton = true,
      showReportButton = true
    } = this.props;
    
    const { 
      hasError, 
      error, 
      errorInfo, 
      errorId, 
      retryCount,
      showDetails 
    } = this.state;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className={cn("border-destructive/50 bg-destructive/5 w-full max-w-md", className)}>
            <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-destructive">
                  Something went wrong
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  An unexpected error occurred. We've been notified and are working to fix it.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                ID: {errorId.slice(-8)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error message */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                {error?.message || 'An unknown error occurred'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {showRetryButton && (
                <Button 
                  onClick={this.handleRetry}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                  {retryCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {retryCount}
                    </Badge>
                  )}
                </Button>
              )}

              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>

              {showDetailsButton && (
                <Button 
                  onClick={this.toggleDetails}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {showDetails ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
              )}

              {showReportButton && (
                <Button 
                  onClick={this.handleCopyError}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Error
                </Button>
              )}
            </div>

            {/* Error details */}
            {showDetails && (
              <div className="space-y-3">
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Error Details
                  </h4>
                  
                  {error?.stack && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Stack Trace:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Component Stack:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help text */}
            <div className="text-xs text-muted-foreground">
              If this problem persists, please contact support with the error ID above.
            </div>
          </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Convenience wrapper for common use cases
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;
