import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogLevel } from '../src/core/logLevel.js';
import { ConsoleColors, LogFormatter } from '../src/utils/formatting.js';

describe('logFormatter', () => {
  describe('formatTimestamp', () => {
    it('should format ISO timestamp to readable time', () => {
      const timestamp = '2025-01-01T12:30:45.123Z';
      const formatted = LogFormatter.formatTimestamp(timestamp);

      // The exact format depends on locale, but should contain time components
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
    });

    it('should handle different timestamp formats', () => {
      const timestamp = '2025-12-31T23:59:59.999Z';
      const formatted = LogFormatter.formatTimestamp(timestamp);

      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
    });
  });

  describe('formatLevel', () => {
    it('should format log levels with correct names', () => {
      expect(LogFormatter.formatLevel(LogLevel.TRACE, false)).toBe('TRACE');
      expect(LogFormatter.formatLevel(LogLevel.DEBUG, false)).toBe('DEBUG');
      expect(LogFormatter.formatLevel(LogLevel.INFO, false)).toBe('INFO ');
      expect(LogFormatter.formatLevel(LogLevel.WARN, false)).toBe('WARN ');
      expect(LogFormatter.formatLevel(LogLevel.ERROR, false)).toBe('ERROR');
      expect(LogFormatter.formatLevel(LogLevel.FATAL, false)).toBe('FATAL');
    });

    it('should include colors when useColors is true', () => {
      const formatted = LogFormatter.formatLevel(LogLevel.ERROR, true);
      expect(formatted).toContain('\x1b[31m'); // Red color code
      expect(formatted).toContain('\x1b[0m'); // Reset code
      expect(formatted).toContain('ERROR');
    });

    it('should not include colors when useColors is false', () => {
      const formatted = LogFormatter.formatLevel(LogLevel.ERROR, false);
      expect(formatted).not.toContain('\x1b[');
      expect(formatted).toBe('ERROR');
    });

    it('should handle unknown log levels', () => {
      const unknownLevel = 999 as LogLevel;
      const formatted = LogFormatter.formatLevel(unknownLevel, false);
      expect(formatted).toBe('UNKNOWN');
    });

    it('should use different colors for different levels', () => {
      const traceFormatted = LogFormatter.formatLevel(LogLevel.TRACE, true);
      const errorFormatted = LogFormatter.formatLevel(LogLevel.ERROR, true);

      expect(traceFormatted).toContain('\x1b[37m'); // White
      expect(errorFormatted).toContain('\x1b[31m'); // Red
      expect(traceFormatted).not.toBe(errorFormatted);
    });
  });

  describe('formatMetadata', () => {
    it('should format empty metadata as empty string', () => {
      expect(LogFormatter.formatMetadata({})).toBe('');
      expect(LogFormatter.formatMetadata(undefined)).toBe('');
    });

    it('should format single metadata property', () => {
      const metadata = { userId: 'user123' };
      const formatted = LogFormatter.formatMetadata(metadata);
      expect(formatted).toBe(' [userId="user123"]');
    });

    it('should format multiple metadata properties', () => {
      const metadata = { userId: 'user123', operation: 'test', count: 42 };
      const formatted = LogFormatter.formatMetadata(metadata);

      expect(formatted).toContain('userId="user123"');
      expect(formatted).toContain('operation="test"');
      expect(formatted).toContain('count=42');
      expect(formatted.startsWith(' [')).toBe(true);
      expect(formatted.endsWith(']')).toBe(true);
    });

    it('should filter out undefined values', () => {
      const metadata = {
        defined: 'value',
        undefined: undefined,
        null: null,
        zero: 0,
      };
      const formatted = LogFormatter.formatMetadata(metadata);

      expect(formatted).toContain('defined="value"');
      expect(formatted).toContain('null=null');
      expect(formatted).toContain('zero=0');
      expect(formatted).not.toContain('undefined');
    });
  });

  describe('formatValue', () => {
    it('should format different value types correctly', () => {
      expect(LogFormatter.formatValue(null)).toBe('null');
      expect(LogFormatter.formatValue(undefined)).toBe('undefined');
      expect(LogFormatter.formatValue('string')).toBe('"string"');
      expect(LogFormatter.formatValue(42)).toBe('42');
      expect(LogFormatter.formatValue(true)).toBe('true');
      expect(LogFormatter.formatValue(false)).toBe('false');
    });

    it('should format objects as JSON', () => {
      const obj = { key: 'value', nested: { prop: 123 } };
      const formatted = LogFormatter.formatValue(obj);
      expect(formatted).toBe('{"key":"value","nested":{"prop":123}}');
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const formatted = LogFormatter.formatValue(circular);
      expect(formatted).toBe('[Object]');
    });

    it('should format arrays as JSON', () => {
      const array = [1, 'test', { key: 'value' }];
      const formatted = LogFormatter.formatValue(array);
      expect(formatted).toBe('[1,"test",{"key":"value"}]');
    });
  });

  describe('formatError', () => {
    it('should format basic error information', () => {
      const error = new Error('Test error message');
      const formatted = LogFormatter.formatError(error);

      expect(formatted).toContain('Error: Test error message');
    });

    it('should include stack trace when available', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test (file.js:1:1)\n    at other (file.js:2:2)';

      const formatted = LogFormatter.formatError(error);
      expect(formatted).toContain('Error: Test error');
      expect(formatted).toContain('at test (file.js:1:1)');
      expect(formatted).toContain('at other (file.js:2:2)');
    });

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const formatted = LogFormatter.formatError(error);
      expect(formatted).toContain('CustomError: Custom error message');
    });

    it('should limit stack trace lines', () => {
      const error = new Error('Test error');
      const longStack =
        'Error: Test error\n' +
        Array.from({ length: 20 }, (_, i) => `    at frame${i} (file.js:${i}:1)`).join('\n');
      error.stack = longStack;

      const formatted = LogFormatter.formatError(error);
      const lines = formatted.split('\n');
      expect(lines.length).toBeLessThanOrEqual(12); // 1 error line + max 10 stack frames + newline
    });

    it('should handle errors without stack trace', () => {
      const error = new Error('No stack');
      error.stack = undefined;

      const formatted = LogFormatter.formatError(error);
      expect(formatted).toBe('Error: No stack');
    });
  });

  describe('formatData', () => {
    it('should format empty data as empty string', () => {
      expect(LogFormatter.formatData({})).toBe('');
      expect(LogFormatter.formatData(undefined)).toBe('');
    });

    it('should format data objects with pretty printing', () => {
      const data = {
        key: 'value',
        nested: {
          array: [1, 2, 3],
          boolean: true,
        },
      };
      const formatted = LogFormatter.formatData(data);

      expect(formatted).toContain('{\n');
      expect(formatted).toContain('  "key": "value"');
      expect(formatted).toContain('  "nested": {');
      expect(formatted).toContain('    "array": [');
    });

    it('should handle unserializable data gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const formatted = LogFormatter.formatData(circular);
      expect(formatted).toBe('\n[Unserializable Data]');
    });
  });
});

describe('consoleColors', () => {
  describe('constants', () => {
    it('should have correct ANSI escape codes', () => {
      expect(ConsoleColors.RESET).toBe('\x1b[0m');
      expect(ConsoleColors.BRIGHT).toBe('\x1b[1m');
      expect(ConsoleColors.DIM).toBe('\x1b[2m');
      expect(ConsoleColors.RED).toBe('\x1b[31m');
      expect(ConsoleColors.GREEN).toBe('\x1b[32m');
      expect(ConsoleColors.YELLOW).toBe('\x1b[33m');
      expect(ConsoleColors.BLUE).toBe('\x1b[34m');
      expect(ConsoleColors.MAGENTA).toBe('\x1b[35m');
      expect(ConsoleColors.CYAN).toBe('\x1b[36m');
      expect(ConsoleColors.WHITE).toBe('\x1b[37m');
      expect(ConsoleColors.GRAY).toBe('\x1b[90m');
    });
  });

  describe('isSupported', () => {
    it('should detect color support', () => {
      const supported = ConsoleColors.isSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should return true when console is available', () => {
      const originalConsole = globalThis.console;
      globalThis.console = {} as Console;

      const supported = ConsoleColors.isSupported();
      expect(supported).toBe(true);

      globalThis.console = originalConsole;
    });

    it('should handle environments without console', () => {
      const originalConsole = globalThis.console;
      const originalWindow = globalThis.window;

      // @ts-expect-error - Testing environment without console
      globalThis.console = undefined;
      // @ts-expect-error - Testing Node.js-like environment
      globalThis.window = undefined;

      const supported = ConsoleColors.isSupported();
      expect(typeof supported).toBe('boolean');

      globalThis.console = originalConsole;
      globalThis.window = originalWindow;
    });
  });

  describe('apply', () => {
    beforeEach(() => {
      // Mock isSupported to return true for consistent testing
      vi.spyOn(ConsoleColors, 'isSupported').mockReturnValue(true);
    });

    it('should apply color when supported', () => {
      const colored = ConsoleColors.apply('test text', ConsoleColors.RED);
      expect(colored).toBe('\x1b[31mtest text\x1b[0m');
    });

    it('should not apply color when not supported', () => {
      vi.spyOn(ConsoleColors, 'isSupported').mockReturnValue(false);
      const colored = ConsoleColors.apply('test text', ConsoleColors.RED);
      expect(colored).toBe('test text');
    });

    it('should handle empty text', () => {
      const colored = ConsoleColors.apply('', ConsoleColors.BLUE);
      expect(colored).toBe('\x1b[34m\x1b[0m');
    });

    it('should work with different colors', () => {
      const red = ConsoleColors.apply('red', ConsoleColors.RED);
      const green = ConsoleColors.apply('green', ConsoleColors.GREEN);
      const blue = ConsoleColors.apply('blue', ConsoleColors.BLUE);

      expect(red).toBe('\x1b[31mred\x1b[0m');
      expect(green).toBe('\x1b[32mgreen\x1b[0m');
      expect(blue).toBe('\x1b[34mblue\x1b[0m');
    });
  });
});
