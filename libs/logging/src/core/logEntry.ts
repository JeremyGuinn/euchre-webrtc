import type { LogLevel } from './logLevel.js';

/**
 * Additional metadata that can be attached to log entries
 */
export interface LogMetadata {
  /**
   * Correlation ID for tracing requests across services
   */
  correlationId?: string;

  /**
   * User identifier for user-specific logging
   */
  userId?: string;

  /**
   * Session identifier
   */
  sessionId?: string;

  /**
   * Request identifier
   */
  requestId?: string;

  /**
   * Component or module name where the log originated
   */
  component?: string;

  /**
   * Operation or action being performed
   */
  operation?: string;

  /**
   * Additional custom properties
   */
  [key: string]: unknown;
}

/**
 * Contextual information for structured logging
 */
export interface LogContext {
  /**
   * Environment (development, staging, production)
   */
  environment?: string;

  /**
   * Application version
   */
  version?: string;

  /**
   * Build identifier
   */
  buildId?: string;

  /**
   * User agent information
   */
  userAgent?: string;

  /**
   * Current URL/route
   */
  url?: string;

  /**
   * Additional context properties
   */
  [key: string]: unknown;
}

/**
 * Performance metrics that can be included with logs
 */
export interface LogPerformanceMetrics {
  /**
   * Duration in milliseconds
   */
  duration?: number;

  /**
   * Memory usage information
   */
  memory?: {
    used?: number;
    total?: number;
  };

  /**
   * Timing marks
   */
  marks?: Record<string, number>;
}

/**
 * A complete log entry with all associated data
 */
export interface LogEntry {
  /**
   * Unique identifier for this log entry
   */
  id: string;

  /**
   * Timestamp when the log was created (ISO 8601)
   */
  timestamp: string;

  /**
   * Log level
   */
  level: LogLevel;

  /**
   * The main log message
   */
  message: string;

  /**
   * Error object if this is an error log
   */
  error?: Error;

  /**
   * Additional data to log
   */
  data?: Record<string, unknown>;

  /**
   * Metadata for structured logging
   */
  metadata?: LogMetadata;

  /**
   * Contextual information
   */
  context?: LogContext;

  /**
   * Performance metrics
   */
  performance?: LogPerformanceMetrics;

  /**
   * Stack trace (for errors or debugging)
   */
  stack?: string;

  /**
   * Logger name/category
   */
  logger?: string;
}

/**
 * Factory function to create log entries with default values
 */
export function createLogEntry(
  level: LogLevel,
  message: string,
  options: Partial<Omit<LogEntry, 'id' | 'timestamp' | 'level' | 'message'>> = {}
): LogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    message,
    ...options,
  };
}
