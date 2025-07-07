import type { LogEntry } from '../core/logEntry.js';
import { LogLevel } from '../core/logLevel.js';
import { LogFormatter } from '../utils/formatting.js';
import { BaseSink } from './baseSink.js';

/**
 * Configuration options for the console sink
 */
export interface ConsoleSinkOptions {
  /**
   * Minimum log level to output
   */
  minLevel?: LogLevel;

  /**
   * Whether to use colors in output
   */
  useColors?: boolean;

  /**
   * Whether to include timestamps
   */
  includeTimestamp?: boolean;

  /**
   * Whether to include metadata
   */
  includeMetadata?: boolean;

  /**
   * Whether to include stack traces for errors
   */
  includeStackTrace?: boolean;

  /**
   * Whether to output as JSON objects (better for browser console inspection)
   */
  outputAsJson?: boolean;

  /**
   * Custom console object (for testing or custom implementations)
   */
  console?: Console;
}

/**
 * Console sink for outputting logs to the browser console or Node.js console
 */
export class ConsoleSink extends BaseSink {
  readonly name = 'console';
  readonly minLevel: LogLevel;

  private readonly useColors: boolean;
  private readonly includeTimestamp: boolean;
  private readonly includeMetadata: boolean;
  private readonly includeStackTrace: boolean;
  private readonly outputAsJson: boolean;
  private readonly console: Console;

  constructor(options: ConsoleSinkOptions = {}) {
    super();

    this.minLevel = options.minLevel ?? LogLevel.DEBUG;
    this.useColors = options.useColors ?? true;
    this.includeTimestamp = options.includeTimestamp ?? true;
    this.includeMetadata = options.includeMetadata ?? true;
    this.includeStackTrace = options.includeStackTrace ?? true;
    this.outputAsJson = options.outputAsJson ?? true;
    this.console = options.console ?? console;
  }

  /**
   * Write a log entry to the console
   */
  write(entry: LogEntry): void {
    if (!this.shouldWrite(entry)) {
      return;
    }

    const consoleMethod = this.getConsoleMethod(entry.level);

    if (this.outputAsJson) {
      // Output as a structured JSON object for better browser console inspection
      const logObject = this.createLogObject(entry);
      consoleMethod(logObject);
    } else {
      // Output as formatted string (legacy mode)
      const formattedMessage = this.formatMessage(entry);
      const additionalData = this.getAdditionalData(entry);

      if (additionalData.length > 0) {
        consoleMethod(formattedMessage, ...additionalData);
      } else {
        consoleMethod(formattedMessage);
      }
    }
  }

  /**
   * Get the appropriate console method for the log level
   */
  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.TRACE:
        return this.console.trace || this.console.log;
      case LogLevel.DEBUG:
        return this.console.debug || this.console.log;
      case LogLevel.INFO:
        return this.console.info || this.console.log;
      case LogLevel.WARN:
        return this.console.warn || this.console.log;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return this.console.error || this.console.log;
      default:
        return this.console.log;
    }
  }

  /**
   * Format the main log message
   */
  private formatMessage(entry: LogEntry): string {
    const parts: string[] = [];

    // Add timestamp
    if (this.includeTimestamp) {
      const timestamp = LogFormatter.formatTimestamp(entry.timestamp);
      parts.push(`[${timestamp}]`);
    }

    // Add log level
    const level = LogFormatter.formatLevel(entry.level, this.useColors);
    parts.push(`[${level}]`);

    // Add logger name if present
    if (entry.logger) {
      parts.push(`[${entry.logger}]`);
    }

    // Add correlation ID if present
    if (entry.metadata?.correlationId) {
      parts.push(`[${entry.metadata.correlationId}]`);
    }

    // Add the main message
    parts.push(entry.message);

    return parts.join(' ');
  }

  /**
   * Create a structured log object for JSON output
   */
  private createLogObject(entry: LogEntry): Record<string, unknown> {
    const logObject: Record<string, unknown> = {
      level: LogLevel[entry.level],
      message: entry.message,
    };

    // Add timestamp if enabled
    if (this.includeTimestamp) {
      logObject.timestamp = entry.timestamp;
      logObject.timestampFormatted = LogFormatter.formatTimestamp(
        entry.timestamp
      );
    }

    // Add logger name if present
    if (entry.logger) {
      logObject.logger = entry.logger;
    }

    // Add metadata if enabled and present
    if (this.includeMetadata && entry.metadata) {
      logObject.metadata = entry.metadata;
    }

    // Add additional data if present
    if (entry.data && Object.keys(entry.data).length > 0) {
      logObject.data = entry.data;
    }

    // Add performance metrics if present
    if (entry.performance) {
      logObject.performance = entry.performance;
    }

    // Add context if present
    if (entry.context && Object.keys(entry.context).length > 0) {
      logObject.context = entry.context;
    }

    // Add error information
    if (entry.error) {
      if (this.includeStackTrace) {
        logObject.error = {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
          // Include any additional error properties
          ...Object.getOwnPropertyNames(entry.error).reduce(
            (acc, key) => {
              if (!['name', 'message', 'stack'].includes(key)) {
                acc[key] = (entry.error as unknown as Record<string, unknown>)[
                  key
                ];
              }
              return acc;
            },
            {} as Record<string, unknown>
          ),
        };
      } else {
        logObject.error = {
          name: entry.error.name,
          message: entry.error.message,
        };
      }
    }

    return logObject;
  }

  /**
   * Get additional data to pass to console methods
   */
  private getAdditionalData(entry: LogEntry): unknown[] {
    const additionalData: unknown[] = [];

    // Create a combined data object for better browser console inspection
    const logData: Record<string, unknown> = {};
    let hasData = false;

    // Add metadata if enabled
    if (this.includeMetadata && entry.metadata) {
      // Filter out correlationId since it's already in the message
      const { correlationId: _correlationId, ...otherMetadata } =
        entry.metadata;
      if (Object.keys(otherMetadata).length > 0) {
        logData.metadata = otherMetadata;
        hasData = true;
      }
    }

    // Add additional data
    if (entry.data && Object.keys(entry.data).length > 0) {
      logData.data = entry.data;
      hasData = true;
    }

    // Add performance metrics if present
    if (entry.performance) {
      logData.performance = entry.performance;
      hasData = true;
    }

    // Add context if present
    if (entry.context && Object.keys(entry.context).length > 0) {
      logData.context = entry.context;
      hasData = true;
    }

    // Add the combined data object if it has content
    if (hasData) {
      additionalData.push(logData);
    }

    // Add error information separately for better stack trace display
    if (entry.error) {
      if (this.includeStackTrace) {
        additionalData.push(entry.error);
      } else {
        additionalData.push({ error: entry.error.message });
      }
    }

    return additionalData;
  }

  /**
   * Override batch writing for better console grouping
   */
  async writeBatch(entries: LogEntry[]): Promise<void> {
    const filteredEntries = entries.filter(entry => this.shouldWrite(entry));

    if (filteredEntries.length === 0) {
      return;
    }

    if (filteredEntries.length === 1) {
      this.write(filteredEntries[0]);
      return;
    }

    // Group related entries for better console output
    this.console.group?.(`Batch Log (${filteredEntries.length} entries)`);

    try {
      for (const entry of filteredEntries) {
        this.write(entry);
      }
    } finally {
      this.console.groupEnd?.();
    }
  }
}
