import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoggerConfig, LogSink } from '../src/config/loggerConfig.js';
import type { LogEntry } from '../src/core/logEntry.js';
import { Logger } from '../src/core/logger.js';
import { LogLevel } from '../src/core/logLevel.js';

// Mock sink for testing
class MockSink implements LogSink {
  readonly name: string;
  readonly minLevel = LogLevel.TRACE;
  public entries: LogEntry[] = [];
  public writeCalled = 0;
  public writeBatchCalled = 0;
  public flushCalled = 0;
  public disposeCalled = 0;

  constructor(name = 'mock') {
    this.name = name;
  }

  write(entry: LogEntry): void {
    this.writeCalled++;
    this.entries.push(entry);
  }

  writeBatch(entries: LogEntry[]): void {
    this.writeBatchCalled++;
    this.entries.push(...entries);
  }

  flush(): void {
    this.flushCalled++;
  }

  dispose(): void {
    this.disposeCalled++;
  }

  reset(): void {
    this.entries = [];
    this.writeCalled = 0;
    this.writeBatchCalled = 0;
    this.flushCalled = 0;
    this.disposeCalled = 0;
  }
}

describe('logger', () => {
  let mockSink: MockSink;
  let logger: Logger;

  beforeEach(() => {
    mockSink = new MockSink();
    logger = new Logger({
      level: LogLevel.TRACE,
      sinks: [mockSink],
      performance: {
        async: false, // Synchronous for testing
        bufferSize: 10,
        flushInterval: 0, // Disable auto-flush for testing
        maxMemoryEntries: 100,
      },
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    mockSink.reset();
  });

  describe('constructor', () => {
    it('should create logger with default config', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger).toBeInstanceOf(Logger);
    });

    it('should merge user config with defaults', () => {
      const config: LoggerConfig = {
        level: LogLevel.WARN,
        name: 'test-logger',
        environment: 'test',
      };
      const testLogger = new Logger(config);
      expect(testLogger).toBeInstanceOf(Logger);
    });

    it('should copy sinks array to prevent mutation', () => {
      const sinks = [mockSink];
      const testLogger = new Logger({ sinks });
      testLogger.addSink(new MockSink());
      expect(sinks).toHaveLength(1); // Original array unchanged
    });
  });

  describe('log levels', () => {
    it('should log trace messages', () => {
      logger.trace('trace message', { key: 'value' });
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].level).toBe(LogLevel.TRACE);
      expect(mockSink.entries[0].message).toBe('trace message');
      expect(mockSink.entries[0].data).toEqual({ key: 'value' });
    });

    it('should log debug messages', () => {
      logger.debug('debug message');
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].level).toBe(LogLevel.DEBUG);
      expect(mockSink.entries[0].message).toBe('debug message');
    });

    it('should log info messages', () => {
      logger.info('info message');
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].level).toBe(LogLevel.INFO);
      expect(mockSink.entries[0].message).toBe('info message');
    });

    it('should log warn messages', () => {
      logger.warn('warn message');
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].level).toBe(LogLevel.WARN);
      expect(mockSink.entries[0].message).toBe('warn message');
    });

    it('should log error messages with Error objects', () => {
      const error = new Error('test error');
      logger.error('error message', error);
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].level).toBe(LogLevel.ERROR);
      expect(mockSink.entries[0].message).toBe('error message');
      expect(mockSink.entries[0].error).toBe(error);
    });

    it('should log error messages with data objects', () => {
      logger.error('error message', { errorData: 'test' });
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].level).toBe(LogLevel.ERROR);
      expect(mockSink.entries[0].message).toBe('error message');
      expect(mockSink.entries[0].data).toEqual({ errorData: 'test' });
    });

    it('should log fatal messages', () => {
      const error = new Error('fatal error');
      logger.fatal('fatal message', error);
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].level).toBe(LogLevel.FATAL);
      expect(mockSink.entries[0].message).toBe('fatal message');
      expect(mockSink.entries[0].error).toBe(error);
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      logger = new Logger({
        level: LogLevel.WARN,
        sinks: [mockSink],
        performance: { async: false },
      });
    });

    it('should filter out messages below threshold', () => {
      logger.trace('trace message');
      logger.debug('debug message');
      logger.info('info message');
      expect(mockSink.entries).toHaveLength(0);
    });

    it('should allow messages at or above threshold', () => {
      logger.warn('warn message');
      logger.error('error message');
      logger.fatal('fatal message');
      expect(mockSink.entries).toHaveLength(3);
    });

    it('should respect disabled state', () => {
      const disabledLogger = new Logger({
        enabled: false,
        sinks: [mockSink],
        performance: { async: false },
      });
      disabledLogger.error('should not log');
      expect(mockSink.entries).toHaveLength(0);
    });
  });

  describe('metadata and context', () => {
    it('should include metadata in log entries', () => {
      const metadata = { userId: 'user123', operation: 'test' };
      logger.info('test message', undefined, metadata);
      expect(mockSink.entries[0].metadata).toMatchObject(metadata);
    });

    it('should merge default metadata with entry metadata', () => {
      const defaultMetadata = { service: 'test-service' };
      const entryMetadata = { userId: 'user123' };
      const testLogger = new Logger({
        defaultMetadata,
        sinks: [mockSink],
        performance: { async: false },
      });

      testLogger.info('test message', undefined, entryMetadata);
      expect(mockSink.entries[0].metadata).toMatchObject({
        ...defaultMetadata,
        ...entryMetadata,
      });
    });
  });

  describe('performance timing', () => {
    it('should measure synchronous function execution', () => {
      const result = logger.logWithTiming(
        LogLevel.INFO,
        'timed operation',
        () => {
          return 'test result';
        }
      );

      expect(result).toBe('test result');
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].performance?.duration).toBeTypeOf('number');
      expect(mockSink.entries[0].performance!.duration).toBeGreaterThanOrEqual(
        0
      );
    });

    it('should measure asynchronous function execution', async () => {
      vi.useRealTimers();

      const result = await logger.logWithTimingAsync(
        LogLevel.INFO,
        'async timed operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async result';
        }
      );

      expect(result).toBe('async result');
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].performance?.duration).toBeTypeOf('number');
      expect(mockSink.entries[0].performance!.duration).toBeGreaterThanOrEqual(
        0
      );
    });
  });

  describe('child loggers', () => {
    it('should create child logger with additional context', () => {
      const childLogger = logger.child({
        name: 'child-logger',
        defaultMetadata: { module: 'test-module' },
      });

      childLogger.info('child message');
      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.entries[0].metadata).toMatchObject({
        module: 'test-module',
      });
    });

    it('should inherit parent configuration', () => {
      const childLogger = logger.child({});
      childLogger.info('child message');
      expect(mockSink.entries).toHaveLength(1);
    });
  });

  describe('sink management', () => {
    it('should add sinks', () => {
      const newSink = new MockSink('new-sink');
      logger.addSink(newSink);

      logger.info('test message');
      expect(mockSink.entries).toHaveLength(1);
      expect(newSink.entries).toHaveLength(1);
    });

    it('should remove sinks by name', () => {
      const removed = logger.removeSink('mock');
      expect(removed).toBe(true);

      logger.info('test message');
      expect(mockSink.entries).toHaveLength(0);
    });

    it('should return false when removing non-existent sink', () => {
      const removed = logger.removeSink('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('buffering and flushing', () => {
    beforeEach(() => {
      logger = new Logger({
        sinks: [mockSink],
        performance: {
          async: true,
          bufferSize: 3,
          flushInterval: 1000,
        },
      });
    });

    it('should flush buffer manually', async () => {
      logger.info('message 1');
      logger.info('message 2');
      expect(mockSink.entries).toHaveLength(0); // Buffered

      await logger.flush();
      expect(mockSink.entries).toHaveLength(2);
    });

    it('should auto-flush when buffer is full', async () => {
      vi.useRealTimers();

      logger.info('message 1');
      logger.info('message 2');
      logger.info('message 3'); // Should trigger flush

      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockSink.entries).toHaveLength(3);
    });

    it('should dispose cleanly', async () => {
      logger.info('message');
      await logger.dispose();

      expect(mockSink.entries).toHaveLength(1);
      expect(mockSink.disposeCalled).toBe(1);
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      logger = new Logger({
        sinks: [mockSink],
        filters: [
          {
            rateLimitPerMinute: 2, // Limit to 2 messages per minute
          },
        ],
        performance: { async: false },
      });
    });

    it('should limit repeated messages', () => {
      logger.info('repeated message');
      logger.info('repeated message');
      logger.info('repeated message'); // Should be rate limited

      expect(mockSink.entries).toHaveLength(2);
    });

    it('should allow different messages', () => {
      logger.info('message 1');
      logger.info('message 2');
      logger.info('message 3');

      expect(mockSink.entries).toHaveLength(3);
    });
  });

  describe('sampling', () => {
    beforeEach(() => {
      logger = new Logger({
        sinks: [mockSink],
        filters: [
          {
            samplingRate: 0.3, // 30% sampling rate
          },
        ],
        performance: { async: false },
      });
    });

    it('should drop messages based on sampling rate', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      logger.info('sampled message');
      expect(mockSink.entries).toHaveLength(0); // 0.5 > 0.3, so dropped
    });

    it('should allow messages within sampling rate', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.2);
      logger.info('sampled message');
      expect(mockSink.entries).toHaveLength(1); // 0.2 <= 0.3, so allowed
    });
  });
});
