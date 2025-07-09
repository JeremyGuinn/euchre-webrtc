import {
  ConsoleSink,
  createLogger,
  LogLevel,
  type LogContext,
  type Logger,
  type LogMetadata,
} from '@euchre/logging';

/**
 * Global application logger instance
 */
let appLogger: Logger;

/**
 * Initialize the application logger with environment-specific configuration
 */
export function initializeLogger(): Logger {
  const isDevelopment = import.meta.env.DEV;
  const logLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  const consoleSink = new ConsoleSink({
    minLevel: logLevel,
    useColors: isDevelopment,
  });

  appLogger = createLogger({
    name: 'euchre-webrtc',
    level: logLevel,
    environment: isDevelopment ? 'development' : 'production',
    version: '1.0.0',
    sinks: [consoleSink],
    defaultMetadata: {
      app: 'euchre-webrtc',
      client: 'web',
    },
    performance: {
      bufferSize: 50,
      flushInterval: 3000,
      maxMemoryEntries: 500,
      async: true,
    },
  });

  return appLogger;
}

/**
 * Get the application logger instance
 */
export function getLogger(): Logger {
  if (!appLogger) {
    initializeLogger();
  }
  return appLogger;
}

/**
 * Context stack for hierarchical logging
 */
const contextStack: LogContext[] = [];

/**
 * Add a logging context to the stack
 * @param context - The context to add
 * @returns A function to remove the context from the stack
 */
export function pushLogContext(context: LogContext): () => void {
  contextStack.push(context);
  return () => {
    const index = contextStack.indexOf(context);
    if (index !== -1) {
      contextStack.splice(index, 1);
    }
  };
}

/**
 * Get the current merged logging context from the stack
 */
export function getCurrentLogContext(): LogContext {
  return contextStack.reduce((merged, context) => ({ ...merged, ...context }), {});
}

/**
 * Create a scoped logger that automatically includes the current context
 */
export function createScopedLogger(
  component: string,
  additionalContext?: LogContext
): {
  trace: (message: string, metadata?: LogMetadata) => void;
  debug: (message: string, metadata?: LogMetadata) => void;
  info: (message: string, metadata?: LogMetadata) => void;
  warn: (message: string, metadata?: LogMetadata) => void;
  error: (message: string, metadata?: LogMetadata) => void;
  withContext: <T>(context: LogContext, fn: () => T) => T;
  withOperation: <T>(operation: string, fn: () => T) => T;
  withPerformance: <T>(operation: string, fn: () => T) => T;
} {
  const logger = getLogger();

  const createLogMethod =
    (level: 'trace' | 'debug' | 'info' | 'warn' | 'error') =>
    (message: string, metadata?: LogMetadata) => {
      const currentContext = getCurrentLogContext();
      const fullContext = {
        ...currentContext,
        ...additionalContext,
        component,
      };

      logger[level](message, {
        ...metadata,
        ...fullContext,
      });
    };

  return {
    trace: createLogMethod('trace'),
    debug: createLogMethod('debug'),
    info: createLogMethod('info'),
    warn: createLogMethod('warn'),
    error: createLogMethod('error'),

    /**
     * Execute a function with additional logging context
     */
    withContext: <T>(context: LogContext, fn: () => T): T => {
      const removeContext = pushLogContext(context);
      try {
        return fn();
      } finally {
        removeContext();
      }
    },

    /**
     * Execute a function with operation context
     */
    withOperation: <T>(operation: string, fn: () => T): T => {
      const removeContext = pushLogContext({ operation });
      try {
        return fn();
      } finally {
        removeContext();
      }
    },

    /**
     * Execute a function with performance timing
     */
    withPerformance: <T>(operation: string, fn: () => T): T => {
      const start = performance.now();
      const removeContext = pushLogContext({ operation });

      try {
        const result = fn();
        const duration = performance.now() - start;

        createLogMethod('debug')(`Operation completed: ${operation}`, {
          duration: `${duration.toFixed(2)}ms`,
          performanceMetrics: { duration },
        });

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        createLogMethod('error')(`Operation failed: ${operation}`, {
          duration: `${duration.toFixed(2)}ms`,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        removeContext();
      }
    },
  };
}

/**
 * React hook for component-level logging
 */
export function useLogger(componentName: string, additionalContext?: LogContext) {
  return createScopedLogger(componentName, additionalContext);
}
