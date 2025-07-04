import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

import {
  cardVariants,
  debugVariants,
  layoutVariants,
  textVariants,
} from '../../utils/classVariants';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import ButtonDivider from '../ui/ButtonDivider';
import LinkButton from '../ui/LinkButton';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error for debugging
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            layoutVariants.centerScreen,
            'bg-gradient-to-br from-red-800 to-red-600'
          )}
        >
          <div className={cn(layoutVariants.container, cardVariants.default)}>
            {/* Card symbols decoration */}
            <div className={cn('text-6xl mb-6 text-center space-x-2')}>
              <span className='text-black'>♠️</span>
              <span className='text-red-600'>♥️</span>
              <span className='text-red-600'>♦️</span>
              <span className='text-black'>♣️</span>
            </div>

            {/* Error message */}
            <div className={cn('text-center mb-8')}>
              <h1 className={textVariants.heading}>
                Oops! Something went wrong
              </h1>
              <p className={textVariants.body}>
                It looks like you&apos;ve been dealt a bad hand! The game
                encountered an unexpected error.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className={debugVariants.details}>
                  <summary className={debugVariants.summary}>
                    Error Details (Development)
                  </summary>
                  <div className={debugVariants.errorInfo}>
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack trace:</strong>
                      <pre className={debugVariants.codeBlock}>
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component stack:</strong>
                        <pre className={debugVariants.codeBlock}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Action buttons */}
            <div className={layoutVariants.flexColumn}>
              <Button onClick={this.handleReset} variant='primary' fullWidth>
                🔄 Try Again
              </Button>

              <ButtonDivider />

              <LinkButton to='/' variant='success'>
                🏠 Go Home
              </LinkButton>
            </div>

            {/* Fun euchre-themed message */}
            <div className={cn('mt-8 p-4 bg-gray-50 rounded-lg')}>
              <p className={cn(textVariants.caption, 'italic text-center')}>
                Even the best Euchre players sometimes get a misdeal. Let&apos;s
                shuffle the deck and try again!
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error) => {
    throw error; // This will be caught by the nearest ErrorBoundary
  };
}
