import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { LogContext, LogMetadata } from '../src/core/logEntry.js';
import { createLogEntry } from '../src/core/logEntry.js';
import { LogLevel } from '../src/core/logLevel.js';

// Mock crypto.randomUUID for consistent testing
const mockUUID = 'test-uuid-123';
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => mockUUID,
  },
});

describe('createLogEntry', () => {
  let fixedDate: Date;

  beforeAll(() => {
    // Mock Date.now for consistent testing
    fixedDate = new Date('2025-01-01T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should create a basic log entry with required fields', () => {
    const entry = createLogEntry(LogLevel.INFO, 'Test message');

    expect(entry).toMatchObject({
      id: mockUUID,
      timestamp: fixedDate.toISOString(),
      level: LogLevel.INFO,
      message: 'Test message',
    });
  });

  it('should include optional fields when provided', () => {
    const error = new Error('Test error');
    const data = { key: 'value' };
    const metadata: LogMetadata = {
      userId: 'user123',
      correlationId: 'corr-456',
    };
    const context: LogContext = { environment: 'test', version: '1.0.0' };

    const entry = createLogEntry(LogLevel.ERROR, 'Error message', {
      error,
      data,
      metadata,
      context,
      logger: 'test-logger',
    });

    expect(entry).toMatchObject({
      id: mockUUID,
      timestamp: fixedDate.toISOString(),
      level: LogLevel.ERROR,
      message: 'Error message',
      error,
      data,
      metadata,
      context,
      logger: 'test-logger',
    });
  });

  it('should handle different log levels correctly', () => {
    const levels = [
      LogLevel.TRACE,
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];

    levels.forEach(level => {
      const entry = createLogEntry(level, `Message for ${level}`);
      expect(entry.level).toBe(level);
      expect(entry.message).toBe(`Message for ${level}`);
    });
  });

  it('should generate unique IDs for different entries', () => {
    // Temporarily restore real crypto for this test
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => Math.random().toString(),
      },
    });

    const entry1 = createLogEntry(LogLevel.INFO, 'Message 1');
    const entry2 = createLogEntry(LogLevel.INFO, 'Message 2');

    expect(entry1.id).not.toBe(entry2.id);

    // Restore mock
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => mockUUID,
      },
    });
  });

  it('should handle complex metadata objects', () => {
    const complexMetadata: LogMetadata = {
      userId: 'user-123',
      sessionId: 'session-456',
      correlationId: 'correlation-789',
      component: 'auth-service',
      operation: 'login',
      customData: {
        nested: {
          value: 42,
          array: [1, 2, 3],
        },
      },
    };

    const entry = createLogEntry(LogLevel.INFO, 'Complex metadata test', {
      metadata: complexMetadata,
    });

    expect(entry.metadata).toEqual(complexMetadata);
  });

  it('should handle performance metrics', () => {
    const performanceMetrics = {
      duration: 150.5,
      memory: {
        used: 1024 * 1024,
        total: 2048 * 1024,
      },
      marks: {
        start: 0,
        checkpoint1: 50.2,
        end: 150.5,
      },
    };

    const entry = createLogEntry(LogLevel.INFO, 'Performance test', {
      performance: performanceMetrics,
    });

    expect(entry.performance).toEqual(performanceMetrics);
  });

  it('should include stack trace when provided', () => {
    const error = new Error('Test error with stack');
    const customStack = 'Custom stack trace\n  at test (file.js:10:5)';

    const entry = createLogEntry(LogLevel.ERROR, 'Stack trace test', {
      error,
      stack: customStack,
    });

    expect(entry.stack).toBe(customStack);
    expect(entry.error).toBe(error);
  });

  it('should handle empty and null values gracefully', () => {
    const entry = createLogEntry(LogLevel.INFO, '', {
      data: {},
      metadata: {},
      context: {},
    });

    expect(entry.message).toBe('');
    expect(entry.data).toEqual({});
    expect(entry.metadata).toEqual({});
    expect(entry.context).toEqual({});
  });
});
