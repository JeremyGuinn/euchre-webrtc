import type { LogEntry } from '../core/logEntry.js';
import type { LogLevel } from '../core/logLevel.js';

/**
 * Base interface for log sinks that handle the actual output of log entries
 */
export interface LogSink {
  /**
   * Unique identifier for this sink
   */
  readonly name: string;

  /**
   * Minimum log level this sink will handle
   */
  readonly minLevel: LogLevel;

  /**
   * Write a log entry to this sink
   */
  write(entry: LogEntry): Promise<void> | void;

  /**
   * Write multiple log entries in batch (optional optimization)
   */
  writeBatch?(entries: LogEntry[]): Promise<void> | void;

  /**
   * Flush any buffered entries
   */
  flush?(): Promise<void> | void;

  /**
   * Clean up resources when the sink is no longer needed
   */
  dispose?(): Promise<void> | void;
}

/**
 * Configuration options for log filtering and sampling
 */
export interface LogFilterConfig {
  /**
   * Minimum log level to process
   */
  minLevel?: LogLevel;

  /**
   * Maximum number of logs per time window
   */
  rateLimitPerMinute?: number;

  /**
   * Sampling rate (0-1) for high-volume logs
   */
  samplingRate?: number;

  /**
   * Skip logs matching these patterns
   */
  skipPatterns?: string[];

  /**
   * Only include logs matching these patterns
   */
  includePatterns?: string[];

  /**
   * Custom filter function
   */
  customFilter?: (entry: LogEntry) => boolean;
}

/**
 * Configuration for performance optimizations
 */
export interface LogPerformanceConfig {
  /**
   * Maximum number of entries to buffer before flushing
   */
  bufferSize?: number;

  /**
   * Maximum time to wait before flushing buffer (ms)
   */
  flushInterval?: number;

  /**
   * Maximum number of log entries to keep in memory
   */
  maxMemoryEntries?: number;

  /**
   * Enable async processing for better performance
   */
  async?: boolean;
}

/**
 * Main logger configuration
 */
export interface LoggerConfig {
  /**
   * Global minimum log level
   */
  level?: LogLevel;

  /**
   * Logger name/category
   */
  name?: string;

  /**
   * Environment context
   */
  environment?: string;

  /**
   * Application version
   */
  version?: string;

  /**
   * Default metadata to include with all log entries
   */
  defaultMetadata?: Record<string, unknown>;

  /**
   * Default context to include with all log entries
   */
  defaultContext?: Record<string, unknown>;

  /**
   * Registered sinks for log output
   */
  sinks?: LogSink[];

  /**
   * Filtering configuration - array of filters applied in order
   */
  filters?: LogFilterConfig[];

  /**
   * Performance configuration
   */
  performance?: LogPerformanceConfig;

  /**
   * Enable/disable logging entirely
   */
  enabled?: boolean;
}
