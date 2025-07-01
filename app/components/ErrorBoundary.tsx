import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Link } from "react-router";
import LinkButton from "./LinkButton";
import ButtonDivider from "./ButtonDivider";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    
    // Log the error for debugging
    console.error("Error caught by boundary:", error);
    console.error("Error info:", errorInfo);
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
        <div className="min-h-screen bg-gradient-to-br from-red-800 to-red-600 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
            {/* Card symbols decoration */}
            <div className="text-6xl mb-6 text-center space-x-2">
              <span className="text-black">♠️</span>
              <span className="text-red-600">♥️</span>
              <span className="text-red-600">♦️</span>
              <span className="text-black">♣️</span>
            </div>

            {/* Error message */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                It looks like you've been dealt a bad hand! The game encountered an unexpected error.
              </p>
              
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack trace:</strong>
                      <pre className="mt-1 text-xs overflow-auto bg-gray-100 p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto bg-gray-100 p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                🔄 Try Again
              </button>
              
              <ButtonDivider />

              <LinkButton
                to="/"
                variant="success"
              >
                🏠 Go Home
              </LinkButton>
            </div>

            {/* Fun euchre-themed message */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 italic text-center">
                "Even the best Euchre players sometimes get a misdeal. 
                Let's shuffle the deck and try again!"
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
