/**
 * Frontend error handling utilities with Sentry integration
 */
import React from 'react';

// Environment variables
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const shouldUseSentry = Boolean(SENTRY_DSN);

// Dynamic Sentry import and initialization
let Sentry: any = null;

if (shouldUseSentry) {
  import('@sentry/react').then((sentryModule) => {
    Sentry = sentryModule;
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.BrowserTracing(),
      ],
    });
  }).catch(() => {
    console.warn('Failed to load Sentry');
  });
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Log error to configured destination (Sentry if enabled, console otherwise)
 */
export function logError(
  error: Error | string,
  context?: ErrorContext
): void {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  if (shouldUseSentry && Sentry) {
    // Log to Sentry
    Sentry.withScope((scope: any) => {
      if (context?.component) {
        scope.setTag('component', context.component);
      }
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context?.additionalData) {
        scope.setContext('additional', context.additionalData);
      }
      
      Sentry.captureException(errorObj);
    });
  } else {
    // Fallback to console logging
    console.error('Error occurred:', {
      error: errorObj,
      message: errorObj.message,
      stack: errorObj.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Log API errors with request context
 */
export function logApiError(
  error: any,
  endpoint: string,
  method: string = 'GET',
  context?: ErrorContext
): void {
  const apiContext = {
    ...context,
    endpoint,
    method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
  };
  
  logError(error, apiContext);
}

/**
 * Log user action errors
 */
export function logUserError(
  error: Error | string,
  action: string,
  component: string,
  additionalData?: Record<string, any>
): void {
  logError(error, {
    component,
    action,
    additionalData,
  });
}

/**
 * Default error fallback component
 */
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
      <p className="text-red-600 mb-4 text-center">{error.message}</p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Simple Error Boundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SimpleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: { errorInfo },
    });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * React Error Boundary component
 */
export const ErrorBoundary = shouldUseSentry && Sentry
  ? ({ children }: { children: React.ReactNode }) => {
      // Use Sentry's error boundary if available
      const SentryErrorBoundary = Sentry.withErrorBoundary(() => <>{children}</>, {
        fallback: ErrorFallback,
        beforeCapture: (scope: any) => {
          scope.setTag('errorBoundary', true);
        },
      });
      return <SentryErrorBoundary />;
    }
  : SimpleErrorBoundary;

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  if (shouldUseSentry && Sentry) {
    return Sentry.withErrorBoundary(Component, {
      fallback: fallback || ErrorFallback,
      beforeCapture: (scope: any) => {
        scope.setTag('errorBoundary', true);
      },
    });
  }
  
  // Simple error boundary fallback for non-Sentry mode
  return Component;
}

export { Sentry };
