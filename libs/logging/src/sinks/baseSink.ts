import type { LogSink } from '../config/loggerConfig.js';
import type { LogEntry } from '../core/logEntry.js';
import type { LogLevel } from '../core/logLevel.js';

/**
 * Abstract base class for log sinks providing common functionality
 */
export abstract class BaseSink implements LogSink {
  abstract readonly name: string;
  abstract readonly minLevel: LogLevel;

  /**
   * Filter entries based on minimum level
   */
  protected shouldWrite(entry: LogEntry): boolean {
    return entry.level >= this.minLevel;
  }

  /**
   * Abstract write method to be implemented by concrete sinks
   */
  abstract write(entry: LogEntry): Promise<void> | void;

  /**
   * Default batch write implementation (can be overridden for optimization)
   */
  async writeBatch(entries: LogEntry[]): Promise<void> {
    const filteredEntries = entries.filter(entry => this.shouldWrite(entry));

    for (const entry of filteredEntries) {
      await this.write(entry);
    }
  }

  /**
   * Default flush implementation (no-op, can be overridden)
   */
  async flush(): Promise<void> {
    // No-op by default
  }

  /**
   * Default dispose implementation (no-op, can be overridden)
   */
  async dispose(): Promise<void> {
    // No-op by default
  }
}
