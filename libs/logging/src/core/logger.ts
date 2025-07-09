import type { LoggerConfig, LogSink } from '../config/loggerConfig.js';
import { CorrelationManager, PerformanceTimer, SessionManager } from '../utils/correlation.js';
import type { LogContext, LogEntry, LogMetadata, LogPerformanceMetrics } from './logEntry.js';
import { createLogEntry } from './logEntry.js';
import { LogLevel, LogLevelUtils } from './logLevel.js';

/**
 * Rate limiting state for log filtering
 */
interface RateLimitState {
  count: number;
  windowStart: number;
  windowSize: number; // in milliseconds
}

/**
 * Fully resolved logger configuration with all properties required
 */
interface ResolvedLoggerConfig {
  level: LogLevel;
  name: string;
  environment: string;
  version: string;
  defaultMetadata: Record<string, unknown>;
  defaultContext: Record<string, unknown>;
  sinks: LogSink[];
  filters: Array<{
    minLevel: LogLevel;
    rateLimitPerMinute?: number;
    samplingRate?: number;
    skipPatterns: string[];
    includePatterns: string[];
    customFilter?: (entry: LogEntry) => boolean;
  }>;
  performance: {
    bufferSize: number;
    flushInterval: number;
    maxMemoryEntries: number;
    async: boolean;
  };
  enabled: boolean;
}

/**
 * Default configuration for the logger
 */
const DEFAULT_LOGGER_CONFIG: ResolvedLoggerConfig = {
  level: LogLevel.INFO,
  name: 'default',
  environment: 'development',
  version: '1.0.0',
  defaultMetadata: {},
  defaultContext: {},
  sinks: [],
  filters: [],
  performance: {
    bufferSize: 100,
    flushInterval: 5000,
    maxMemoryEntries: 1000,
    async: true,
  },
  enabled: true,
};

/**
 * Deep merge utility for configuration objects
 */
function mergeConfig(
  defaultConfig: ResolvedLoggerConfig,
  userConfig: LoggerConfig
): ResolvedLoggerConfig {
  // Merge filters array properly
  const mergedFilters = userConfig.filters
    ? userConfig.filters.map(userFilter => ({
        minLevel: userFilter.minLevel ?? LogLevel.TRACE,
        rateLimitPerMinute: userFilter.rateLimitPerMinute,
        samplingRate: userFilter.samplingRate,
        skipPatterns: userFilter.skipPatterns ?? [],
        includePatterns: userFilter.includePatterns ?? [],
        customFilter: userFilter.customFilter,
      }))
    : defaultConfig.filters;

  return {
    level: userConfig.level ?? defaultConfig.level,
    name: userConfig.name ?? defaultConfig.name,
    environment: userConfig.environment ?? defaultConfig.environment,
    version: userConfig.version ?? defaultConfig.version,
    defaultMetadata: {
      ...defaultConfig.defaultMetadata,
      ...userConfig.defaultMetadata,
    },
    defaultContext: {
      ...defaultConfig.defaultContext,
      ...userConfig.defaultContext,
    },
    sinks: userConfig.sinks ?? defaultConfig.sinks,
    filters: mergedFilters,
    performance: {
      bufferSize: userConfig.performance?.bufferSize ?? defaultConfig.performance.bufferSize,
      flushInterval:
        userConfig.performance?.flushInterval ?? defaultConfig.performance.flushInterval,
      maxMemoryEntries:
        userConfig.performance?.maxMemoryEntries ?? defaultConfig.performance.maxMemoryEntries,
      async: userConfig.performance?.async ?? defaultConfig.performance.async,
    },
    enabled: userConfig.enabled ?? defaultConfig.enabled,
  };
}

/**
 * Main Logger class providing enterprise-grade logging functionality
 */
export class Logger {
  private readonly config: ResolvedLoggerConfig;
  private readonly sinks: LogSink[];
  private readonly rateLimitStates: Map<string, RateLimitState> = new Map();
  private readonly logBuffer: LogEntry[] = [];
  private flushTimer: number | null = null;

  constructor(config: LoggerConfig = {}) {
    // Merge user config with defaults
    this.config = mergeConfig(DEFAULT_LOGGER_CONFIG, config);
    this.sinks = [...this.config.sinks];
    this.startFlushTimer();
  }

  /**
   * Log a trace message
   */
  trace(message: string, data?: Record<string, unknown>, metadata?: LogMetadata): void {
    this.log(LogLevel.TRACE, message, data, metadata);
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, unknown>, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, data, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, unknown>, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, data, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, unknown>, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, data, metadata);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | Record<string, unknown>, metadata?: LogMetadata): void {
    let errorObj: Error | undefined;
    let dataObj: Record<string, unknown> | undefined;

    if (error instanceof Error) {
      errorObj = error;
    } else if (error) {
      dataObj = error;
    }

    this.log(LogLevel.ERROR, message, dataObj, metadata, errorObj);
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error | Record<string, unknown>, metadata?: LogMetadata): void {
    let errorObj: Error | undefined;
    let dataObj: Record<string, unknown> | undefined;

    if (error instanceof Error) {
      errorObj = error;
    } else if (error) {
      dataObj = error;
    }

    this.log(LogLevel.FATAL, message, dataObj, metadata, errorObj);
  }

  /**
   * Log with performance timing
   */
  logWithTiming<T>(level: LogLevel, message: string, fn: () => T, metadata?: LogMetadata): T {
    const { result, metrics } = PerformanceTimer.measure(fn);

    this.log(level, message, undefined, metadata, undefined, metrics);

    return result;
  }

  /**
   * Log with async performance timing
   */
  async logWithTimingAsync<T>(
    level: LogLevel,
    message: string,
    fn: () => Promise<T>,
    metadata?: LogMetadata
  ): Promise<T> {
    const { result, metrics } = await PerformanceTimer.measureAsync(fn);

    this.log(level, message, undefined, metadata, undefined, metrics);

    return result;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LoggerConfig>): Logger {
    const childConfig: LoggerConfig = {
      ...this.config,
      name: additionalContext.name ?? `${this.config.name}.child`,
      defaultMetadata: {
        ...this.config.defaultMetadata,
        ...additionalContext.defaultMetadata,
      },
      defaultContext: {
        ...this.config.defaultContext,
        ...additionalContext.defaultContext,
      },
    };

    return new Logger(childConfig);
  }

  /**
   * Add a sink to this logger
   */
  addSink(sink: LogSink): void {
    this.sinks.push(sink);
  }

  /**
   * Remove a sink from this logger
   */
  removeSink(sinkName: string): boolean {
    const index = this.sinks.findIndex(sink => sink.name === sinkName);
    if (index >= 0) {
      this.sinks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Flush all buffered log entries
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const entries = [...this.logBuffer];
    this.logBuffer.length = 0;

    await this.writeToSinks(entries);
  }

  /**
   * Dispose of the logger and clean up resources
   */
  async dispose(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flush();

    for (const sink of this.sinks) {
      if (sink.dispose) {
        await sink.dispose();
      }
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    metadata?: LogMetadata,
    error?: Error,
    performance?: LogPerformanceMetrics
  ): void {
    if (!this.config.enabled || !this.shouldLog(level, message)) {
      return;
    }

    const entry = this.createLogEntry(level, message, data, metadata, error, performance);

    if (this.config.performance.async) {
      this.bufferEntry(entry);
    } else {
      void this.writeToSinks([entry]);
    }
  }

  /**
   * Create a complete log entry with all context
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    metadata?: LogMetadata,
    error?: Error,
    performance?: LogPerformanceMetrics
  ): LogEntry {
    const correlationId = CorrelationManager.getCurrentId();
    const sessionMetadata = SessionManager.getSessionMetadata();

    const combinedMetadata: LogMetadata = {
      ...this.config.defaultMetadata,
      ...sessionMetadata,
      ...metadata,
    };

    if (correlationId) {
      combinedMetadata.correlationId = correlationId;
    }

    const combinedContext: LogContext = {
      environment: this.config.environment,
      version: this.config.version,
      ...this.config.defaultContext,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    return createLogEntry(level, message, {
      data,
      metadata: combinedMetadata,
      context: combinedContext,
      error,
      performance,
      logger: this.config.name,
      stack: error?.stack,
    });
  }

  /**
   * Check if a log should be written based on filters
   * Precedence: 1) Global level, 2) Filter array (all must pass), 3) Sink level (checked later)
   */
  private shouldLog(level: LogLevel, message: string): boolean {
    // 1. Check global minimum level first
    if (!LogLevelUtils.meetsThreshold(level, this.config.level)) {
      return false;
    }

    // 2. Apply all filters in order - if any filter rejects, reject the log
    for (const filter of this.config.filters) {
      if (!this.applyFilter(level, message, filter)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Apply a single filter to a log entry
   */
  private applyFilter(
    level: LogLevel,
    message: string,
    filter: {
      minLevel: LogLevel;
      rateLimitPerMinute?: number;
      samplingRate?: number;
      skipPatterns: string[];
      includePatterns: string[];
      customFilter?: (entry: LogEntry) => boolean;
    }
  ): boolean {
    // Check filter minimum level
    if (!LogLevelUtils.meetsThreshold(level, filter.minLevel)) {
      return false;
    }

    // Check rate limiting
    if (filter.rateLimitPerMinute && !this.checkRateLimit(message, filter.rateLimitPerMinute)) {
      return false;
    }

    // Check sampling
    if (filter.samplingRate && Math.random() > filter.samplingRate) {
      return false;
    }

    // Check skip patterns
    if (filter.skipPatterns.some((pattern: string) => message.includes(pattern))) {
      return false;
    }

    // Check include patterns
    if (
      filter.includePatterns.length > 0 &&
      !filter.includePatterns.some((pattern: string) => message.includes(pattern))
    ) {
      return false;
    }

    // Apply custom filter if present
    if (filter.customFilter) {
      // We need to create a temporary log entry for the custom filter
      const tempEntry = this.createLogEntry(level, message);
      if (!filter.customFilter(tempEntry)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check rate limiting for a message
   */
  private checkRateLimit(message: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const windowSize = 60000; // 1 minute
    const key = message.substring(0, 50); // Use first 50 chars as key

    let state = this.rateLimitStates.get(key);

    if (!state || now - state.windowStart >= windowSize) {
      state = {
        count: 0,
        windowStart: now,
        windowSize,
      };
      this.rateLimitStates.set(key, state);
    }

    state.count++;
    return state.count <= limitPerMinute;
  }

  /**
   * Buffer a log entry for batch processing
   */
  private bufferEntry(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Check if buffer is full
    if (this.logBuffer.length >= this.config.performance.bufferSize) {
      void this.flush();
    }

    // Prevent memory leaks
    if (this.logBuffer.length > this.config.performance.maxMemoryEntries) {
      this.logBuffer.splice(0, this.logBuffer.length - this.config.performance.maxMemoryEntries);
    }
  }

  /**
   * Write entries to all sinks (checking sink-specific level requirements)
   */
  private async writeToSinks(entries: LogEntry[]): Promise<void> {
    const writePromises = this.sinks.map(async sink => {
      try {
        // Filter entries that meet this sink's minimum level
        const filteredEntries = entries.filter(entry =>
          LogLevelUtils.meetsThreshold(entry.level, sink.minLevel)
        );

        if (filteredEntries.length === 0) {
          return;
        }

        if (sink.writeBatch && filteredEntries.length > 1) {
          await sink.writeBatch(filteredEntries);
        } else {
          for (const entry of filteredEntries) {
            await sink.write(entry);
          }
        }
      } catch (error) {
        // Prevent sink errors from breaking the logger
        console.error(`Error writing to sink ${sink.name}:`, error);
      }
    });

    await Promise.allSettled(writePromises);
  }

  /**
   * Start the automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.config.performance.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush();
      }, this.config.performance.flushInterval) as unknown as number;
    }
  }
}
