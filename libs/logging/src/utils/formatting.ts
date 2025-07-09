import type { LogLevel } from '../core/logLevel.js';

/**
 * Formatting utilities for log output
 */
export class LogFormatter {
  /**
   * Format a timestamp for display
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }

  /**
   * Format a log level with color and padding
   */
  static formatLevel(level: LogLevel, useColors = true): string {
    const levelNames: Record<LogLevel, string> = {
      [0]: 'TRACE',
      [1]: 'DEBUG',
      [2]: 'INFO ',
      [3]: 'WARN ',
      [4]: 'ERROR',
      [5]: 'FATAL',
    } as const;

    const levelName = levelNames[level] || 'UNKNOWN';

    if (!useColors) {
      return levelName;
    }

    // ANSI color codes for different log levels
    const colors: Record<LogLevel, string> = {
      [0]: '\x1b[37m', // White (TRACE)
      [1]: '\x1b[36m', // Cyan (DEBUG)
      [2]: '\x1b[32m', // Green (INFO)
      [3]: '\x1b[33m', // Yellow (WARN)
      [4]: '\x1b[31m', // Red (ERROR)
      [5]: '\x1b[35m', // Magenta (FATAL)
    } as const;

    const reset = '\x1b[0m';
    const color = colors[level] || '';

    return `${color}${levelName}${reset}`;
  }

  /**
   * Format metadata for display
   */
  static formatMetadata(metadata?: Record<string, unknown>): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return '';
    }

    const entries = Object.entries(metadata)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${this.formatValue(value)}`);

    return entries.length > 0 ? ` [${entries.join(', ')}]` : '';
  }

  /**
   * Format a value for display
   */
  static formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }
    return String(value);
  }

  /**
   * Format error information
   */
  static formatError(error: Error): string {
    let result = `${error.name}: ${error.message}`;

    if (error.stack) {
      // Clean up stack trace for better readability
      const stackLines = error.stack.split('\n');
      const relevantLines = stackLines
        .slice(1) // Skip the error message line
        .filter(line => line.trim().length > 0)
        .slice(0, 10); // Limit to first 10 stack frames

      if (relevantLines.length > 0) {
        result += '\n' + relevantLines.join('\n');
      }
    }

    return result;
  }

  /**
   * Format additional data
   */
  static formatData(data?: Record<string, unknown>): string {
    if (!data || Object.keys(data).length === 0) {
      return '';
    }

    try {
      return '\n' + JSON.stringify(data, null, 2);
    } catch {
      return '\n[Unserializable Data]';
    }
  }
}

/**
 * Color utilities for console output
 */
export class ConsoleColors {
  static readonly RESET = '\x1b[0m';
  static readonly BRIGHT = '\x1b[1m';
  static readonly DIM = '\x1b[2m';

  // Foreground colors
  static readonly RED = '\x1b[31m';
  static readonly GREEN = '\x1b[32m';
  static readonly YELLOW = '\x1b[33m';
  static readonly BLUE = '\x1b[34m';
  static readonly MAGENTA = '\x1b[35m';
  static readonly CYAN = '\x1b[36m';
  static readonly WHITE = '\x1b[37m';
  static readonly GRAY = '\x1b[90m';

  /**
   * Check if colors are supported in the current environment
   */
  static isSupported(): boolean {
    return typeof window === 'undefined' || (typeof window !== 'undefined' && 'console' in window);
  }

  /**
   * Apply color if supported
   */
  static apply(text: string, color: string): string {
    return this.isSupported() ? `${color}${text}${this.RESET}` : text;
  }
}
