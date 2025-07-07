/**
 * Standard logging levels in order of severity
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

/**
 * String representations of log levels
 */
export const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
} as const;

/**
 * Utility functions for working with log levels
 */
export class LogLevelUtils {
  /**
   * Parse a string to a LogLevel
   */
  static fromString(level: string): LogLevel {
    const upperLevel = level.toUpperCase();
    const entry = Object.entries(LogLevelNames).find(
      ([_, name]) => name === upperLevel
    );

    if (!entry) {
      throw new Error(`Invalid log level: ${level}`);
    }

    return parseInt(entry[0]) as LogLevel;
  }

  /**
   * Check if a log level meets the minimum threshold
   */
  static meetsThreshold(level: LogLevel, threshold: LogLevel): boolean {
    return level >= threshold;
  }

  /**
   * Get all log levels at or above a threshold
   */
  static getEnabledLevels(threshold: LogLevel): LogLevel[] {
    return Object.values(LogLevel)
      .filter((level): level is LogLevel => typeof level === 'number')
      .filter(level => this.meetsThreshold(level, threshold));
  }
}
