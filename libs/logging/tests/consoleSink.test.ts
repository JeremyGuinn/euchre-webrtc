import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogEntry } from '../src/core/logEntry.js';
import { LogLevel } from '../src/core/logLevel.js';
import { ConsoleSink } from '../src/sinks/consoleSink.js';

describe('consoleSink', () => {
  let mockConsole: Console;
  let consoleSink: ConsoleSink;
  let logSpy: ReturnType<typeof vi.fn>;
  let debugSpy: ReturnType<typeof vi.fn>;
  let infoSpy: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;
  let traceSpy: ReturnType<typeof vi.fn>;
  let groupSpy: ReturnType<typeof vi.fn>;
  let groupEndSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logSpy = vi.fn();
    debugSpy = vi.fn();
    infoSpy = vi.fn();
    warnSpy = vi.fn();
    errorSpy = vi.fn();
    traceSpy = vi.fn();
    groupSpy = vi.fn();
    groupEndSpy = vi.fn();

    mockConsole = {
      log: logSpy,
      debug: debugSpy,
      info: infoSpy,
      warn: warnSpy,
      error: errorSpy,
      trace: traceSpy,
      group: groupSpy,
      groupEnd: groupEndSpy,
    } as unknown as Console;

    consoleSink = new ConsoleSink({
      minLevel: LogLevel.TRACE,
      console: mockConsole,
    });
  });

  describe('constructor', () => {
    it('should create sink with default options', () => {
      const defaultSink = new ConsoleSink();
      expect(defaultSink.name).toBe('console');
      expect(defaultSink.minLevel).toBe(LogLevel.DEBUG);
    });

    it('should create sink with custom options', () => {
      const customSink = new ConsoleSink({
        minLevel: LogLevel.WARN,
        useColors: false,
        includeTimestamp: false,
      });
      expect(customSink.minLevel).toBe(LogLevel.WARN);
    });
  });

  describe('write', () => {
    it('should write trace messages using trace method', () => {
      const entry = createLogEntry(LogLevel.TRACE, 'trace message');
      consoleSink.write(entry);
      expect(traceSpy).toHaveBeenCalledTimes(1);
    });

    it('should write debug messages using debug method', () => {
      const entry = createLogEntry(LogLevel.DEBUG, 'debug message');
      consoleSink.write(entry);
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });

    it('should write info messages using info method', () => {
      const entry = createLogEntry(LogLevel.INFO, 'info message');
      consoleSink.write(entry);
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('should write warn messages using warn method', () => {
      const entry = createLogEntry(LogLevel.WARN, 'warn message');
      consoleSink.write(entry);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should write error messages using error method', () => {
      const entry = createLogEntry(LogLevel.ERROR, 'error message');
      consoleSink.write(entry);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should write fatal messages using error method', () => {
      const entry = createLogEntry(LogLevel.FATAL, 'fatal message');
      consoleSink.write(entry);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should not write messages below minimum level', () => {
      const sink = new ConsoleSink({
        minLevel: LogLevel.WARN,
        console: mockConsole,
      });

      const debugEntry = createLogEntry(LogLevel.DEBUG, 'debug message');
      sink.write(debugEntry);

      expect(debugSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should include timestamp when enabled', () => {
      const sink = new ConsoleSink({
        includeTimestamp: true,
        console: mockConsole,
      });

      const entry = createLogEntry(LogLevel.INFO, 'test message');
      sink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const calledMessage = infoSpy.mock.calls[0][0] as string;
      expect(calledMessage).toMatch(/^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}\]/);
    });

    it('should include metadata when enabled', () => {
      const sink = new ConsoleSink({
        includeMetadata: true,
        console: mockConsole,
      });

      const entry = createLogEntry(LogLevel.INFO, 'test message', {
        metadata: { userId: 'user123', operation: 'test' },
      });
      sink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const calledMessage = infoSpy.mock.calls[0][0] as string;
      expect(calledMessage).toContain('userId="user123"');
      expect(calledMessage).toContain('operation="test"');
    });

    it('should include logger name when present', () => {
      const entry = createLogEntry(LogLevel.INFO, 'test message', {
        logger: 'test-logger',
      });
      consoleSink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const calledMessage = infoSpy.mock.calls[0][0] as string;
      expect(calledMessage).toContain('[test-logger]');
    });

    it('should include correlation ID when present', () => {
      const entry = createLogEntry(LogLevel.INFO, 'test message', {
        metadata: { correlationId: 'corr-123' },
      });
      consoleSink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const calledMessage = infoSpy.mock.calls[0][0] as string;
      expect(calledMessage).toContain('[corr-123]');
    });

    it('should handle error objects in additional data', () => {
      const error = new Error('test error');
      const entry = createLogEntry(LogLevel.ERROR, 'error message', {
        error,
      });
      consoleSink.write(entry);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0]).toHaveLength(2); // Message + error info
    });

    it('should handle additional data objects', () => {
      const entry = createLogEntry(LogLevel.INFO, 'test message', {
        data: { key: 'value', nested: { prop: 'test' } },
      });
      consoleSink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy.mock.calls[0]).toHaveLength(2); // Message + data
    });

    it('should handle performance metrics', () => {
      const entry = createLogEntry(LogLevel.INFO, 'test message', {
        performance: { duration: 123, marks: { start: 0, end: 123 } },
      });
      consoleSink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy.mock.calls[0]).toHaveLength(3); // Message + performance data
    });

    it('should handle context information', () => {
      const entry = createLogEntry(LogLevel.INFO, 'test message', {
        context: { environment: 'test', version: '1.0.0' },
      });
      consoleSink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy.mock.calls[0]).toHaveLength(3); // Message + context
    });
  });

  describe('writeBatch', () => {
    it('should write single entry normally', async () => {
      const entry = createLogEntry(LogLevel.INFO, 'single message');
      await consoleSink.writeBatch([entry]);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(groupSpy).not.toHaveBeenCalled();
    });

    it('should group multiple entries', async () => {
      const entries = [
        createLogEntry(LogLevel.INFO, 'message 1'),
        createLogEntry(LogLevel.WARN, 'message 2'),
        createLogEntry(LogLevel.ERROR, 'message 3'),
      ];

      await consoleSink.writeBatch(entries);

      expect(groupSpy).toHaveBeenCalledWith('Batch Log (3 entries)');
      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(groupEndSpy).toHaveBeenCalledTimes(1);
    });

    it('should filter entries by minimum level', async () => {
      const sink = new ConsoleSink({
        minLevel: LogLevel.WARN,
        console: mockConsole,
      });

      const entries = [
        createLogEntry(LogLevel.DEBUG, 'debug message'),
        createLogEntry(LogLevel.INFO, 'info message'),
        createLogEntry(LogLevel.WARN, 'warn message'),
        createLogEntry(LogLevel.ERROR, 'error message'),
      ];

      await sink.writeBatch(entries);

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle empty batch', async () => {
      await consoleSink.writeBatch([]);

      expect(groupSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('should handle console without group methods', async () => {
      const simpleConsole = {
        log: logSpy,
        info: infoSpy,
        warn: warnSpy,
        error: errorSpy,
      } as unknown as Console;

      const sink = new ConsoleSink({ console: simpleConsole });
      const entries = [
        createLogEntry(LogLevel.INFO, 'message 1'),
        createLogEntry(LogLevel.INFO, 'message 2'),
      ];

      await sink.writeBatch(entries);

      expect(infoSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('color handling', () => {
    it('should disable colors when useColors is false', () => {
      const sink = new ConsoleSink({
        useColors: false,
        console: mockConsole,
      });

      const entry = createLogEntry(LogLevel.INFO, 'test message');
      sink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const calledMessage = infoSpy.mock.calls[0][0] as string;
      expect(calledMessage).not.toContain('\x1b['); // No ANSI codes
    });

    it('should include colors when useColors is true', () => {
      const sink = new ConsoleSink({
        useColors: true,
        console: mockConsole,
      });

      const entry = createLogEntry(LogLevel.INFO, 'test message');
      sink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const calledMessage = infoSpy.mock.calls[0][0] as string;
      expect(calledMessage).toContain('\x1b['); // Contains ANSI codes
    });
  });

  describe('optional features', () => {
    it('should exclude timestamp when disabled', () => {
      const sink = new ConsoleSink({
        includeTimestamp: false,
        console: mockConsole,
      });

      const entry = createLogEntry(LogLevel.INFO, 'test message');
      sink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const calledMessage = infoSpy.mock.calls[0][0] as string;
      expect(calledMessage).not.toMatch(/^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}\]/);
    });

    it('should exclude metadata when disabled', () => {
      const sink = new ConsoleSink({
        includeMetadata: false,
        console: mockConsole,
      });

      const entry = createLogEntry(LogLevel.INFO, 'test message', {
        metadata: { userId: 'user123' },
      });
      sink.write(entry);

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const calledMessage = infoSpy.mock.calls[0][0] as string;
      expect(calledMessage).not.toContain('userId');
    });

    it('should exclude stack trace when disabled', () => {
      const sink = new ConsoleSink({
        includeStackTrace: false,
        console: mockConsole,
      });

      const error = new Error('test error');
      const entry = createLogEntry(LogLevel.ERROR, 'error message', {
        error,
      });
      sink.write(entry);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const additionalData = errorSpy.mock.calls[0][1] as string;
      expect(additionalData).toBe('Error: test error');
      expect(additionalData).not.toContain('at '); // No stack trace
    });
  });

  describe('fallback methods', () => {
    it('should fallback to log method when specific methods are not available', () => {
      const minimalConsole = {
        log: logSpy,
      } as unknown as Console;

      const sink = new ConsoleSink({
        console: minimalConsole,
        minLevel: LogLevel.TRACE,
      });

      const entries = [
        createLogEntry(LogLevel.TRACE, 'trace message'),
        createLogEntry(LogLevel.DEBUG, 'debug message'),
        createLogEntry(LogLevel.INFO, 'info message'),
        createLogEntry(LogLevel.WARN, 'warn message'),
        createLogEntry(LogLevel.ERROR, 'error message'),
      ];

      entries.forEach(entry => sink.write(entry));

      expect(logSpy).toHaveBeenCalledTimes(5);
    });
  });
});
