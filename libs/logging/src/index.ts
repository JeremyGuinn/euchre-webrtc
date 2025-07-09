import type { LoggerConfig } from './config/loggerConfig.js';
import { Logger } from './core/logger.js';
import { LogLevel } from './core/logLevel';
import { ConsoleSink } from './sinks/consoleSink.js';

// Core exports
export { createLogEntry } from './core/logEntry.js';
export type { LogContext, LogEntry, LogMetadata, LogPerformanceMetrics } from './core/logEntry.js';
export { Logger } from './core/logger.js';
export { LogLevel, LogLevelNames, LogLevelUtils } from './core/logLevel.js';

// Configuration exports
export type {
  LogFilterConfig,
  LoggerConfig,
  LogPerformanceConfig,
  LogSink,
} from './config/loggerConfig.js';

// Sink exports
export { BaseSink } from './sinks/baseSink.js';
export { ConsoleSink } from './sinks/consoleSink.js';
export type { ConsoleSinkOptions } from './sinks/consoleSink.js';

// Utility exports
export { CorrelationManager, PerformanceTimer, SessionManager } from './utils/correlation.js';
export { ConsoleColors, LogFormatter } from './utils/formatting.js';

// Factory functions and convenience exports
export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}

export function createConsoleLogger(level: LogLevel = LogLevel.INFO): Logger {
  const consoleSink = new ConsoleSink({ minLevel: level });
  return new Logger({
    level,
    sinks: [consoleSink],
  });
}

export function createProductionLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger({
    level: LogLevel.WARN,
    environment: 'production',
    performance: {
      async: true,
      bufferSize: 50,
      flushInterval: 10000, // 10 seconds
    },
    filters: [
      {
        minLevel: LogLevel.WARN,
        rateLimitPerMinute: 100,
      },
    ],
    ...config,
  });
}

export function createDevelopmentLogger(config: Partial<LoggerConfig> = {}): Logger {
  const consoleSink = new ConsoleSink({
    minLevel: LogLevel.DEBUG,
    useColors: true,
    includeTimestamp: true,
    includeMetadata: true,
  });

  return new Logger({
    level: LogLevel.DEBUG,
    environment: 'development',
    sinks: [consoleSink],
    performance: {
      async: false, // Immediate logging for development
    },
    ...config,
  });
}
