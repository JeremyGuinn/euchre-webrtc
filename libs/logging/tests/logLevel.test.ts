import { describe, expect, it } from 'vitest';
import { LogLevel, LogLevelNames, LogLevelUtils } from '../src/core/logLevel.js';

describe('LogLevel', () => {
  it('should have correct numeric values for each level', () => {
    expect(LogLevel.TRACE).toBe(0);
    expect(LogLevel.DEBUG).toBe(1);
    expect(LogLevel.INFO).toBe(2);
    expect(LogLevel.WARN).toBe(3);
    expect(LogLevel.ERROR).toBe(4);
    expect(LogLevel.FATAL).toBe(5);
  });

  it('should maintain proper ordering of severity', () => {
    expect(LogLevel.TRACE).toBeLessThan(LogLevel.DEBUG);
    expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
    expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
    expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
    expect(LogLevel.ERROR).toBeLessThan(LogLevel.FATAL);
  });
});

describe('LogLevelNames', () => {
  it('should have correct string names for each level', () => {
    expect(LogLevelNames[LogLevel.TRACE]).toBe('TRACE');
    expect(LogLevelNames[LogLevel.DEBUG]).toBe('DEBUG');
    expect(LogLevelNames[LogLevel.INFO]).toBe('INFO');
    expect(LogLevelNames[LogLevel.WARN]).toBe('WARN');
    expect(LogLevelNames[LogLevel.ERROR]).toBe('ERROR');
    expect(LogLevelNames[LogLevel.FATAL]).toBe('FATAL');
  });

  it('should have names for all log levels', () => {
    const levels = [
      LogLevel.TRACE,
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];

    levels.forEach(level => {
      expect(LogLevelNames[level]).toBeDefined();
      expect(typeof LogLevelNames[level]).toBe('string');
    });
  });
});

describe('LogLevelUtils', () => {
  describe('fromString', () => {
    it('should parse valid log level strings', () => {
      expect(LogLevelUtils.fromString('TRACE')).toBe(LogLevel.TRACE);
      expect(LogLevelUtils.fromString('DEBUG')).toBe(LogLevel.DEBUG);
      expect(LogLevelUtils.fromString('INFO')).toBe(LogLevel.INFO);
      expect(LogLevelUtils.fromString('WARN')).toBe(LogLevel.WARN);
      expect(LogLevelUtils.fromString('ERROR')).toBe(LogLevel.ERROR);
      expect(LogLevelUtils.fromString('FATAL')).toBe(LogLevel.FATAL);
    });

    it('should handle case-insensitive parsing', () => {
      expect(LogLevelUtils.fromString('trace')).toBe(LogLevel.TRACE);
      expect(LogLevelUtils.fromString('Debug')).toBe(LogLevel.DEBUG);
      expect(LogLevelUtils.fromString('info')).toBe(LogLevel.INFO);
      expect(LogLevelUtils.fromString('WARN')).toBe(LogLevel.WARN);
    });

    it('should throw error for invalid log level strings', () => {
      expect(() => LogLevelUtils.fromString('INVALID')).toThrow('Invalid log level: INVALID');
      expect(() => LogLevelUtils.fromString('')).toThrow('Invalid log level: ');
      expect(() => LogLevelUtils.fromString('VERBOSE')).toThrow('Invalid log level: VERBOSE');
    });
  });

  describe('meetsThreshold', () => {
    it('should return true when level meets or exceeds threshold', () => {
      expect(LogLevelUtils.meetsThreshold(LogLevel.ERROR, LogLevel.WARN)).toBe(true);
      expect(LogLevelUtils.meetsThreshold(LogLevel.WARN, LogLevel.WARN)).toBe(true);
      expect(LogLevelUtils.meetsThreshold(LogLevel.FATAL, LogLevel.ERROR)).toBe(true);
    });

    it('should return false when level is below threshold', () => {
      expect(LogLevelUtils.meetsThreshold(LogLevel.DEBUG, LogLevel.INFO)).toBe(false);
      expect(LogLevelUtils.meetsThreshold(LogLevel.WARN, LogLevel.ERROR)).toBe(false);
      expect(LogLevelUtils.meetsThreshold(LogLevel.TRACE, LogLevel.FATAL)).toBe(false);
    });

    it('should handle edge cases correctly', () => {
      expect(LogLevelUtils.meetsThreshold(LogLevel.TRACE, LogLevel.TRACE)).toBe(true);
      expect(LogLevelUtils.meetsThreshold(LogLevel.FATAL, LogLevel.FATAL)).toBe(true);
    });
  });

  describe('getEnabledLevels', () => {
    it('should return all levels at or above threshold', () => {
      const infoAndAbove = LogLevelUtils.getEnabledLevels(LogLevel.INFO);
      expect(infoAndAbove).toEqual([LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]);
    });

    it('should return only higher levels for high thresholds', () => {
      const errorAndAbove = LogLevelUtils.getEnabledLevels(LogLevel.ERROR);
      expect(errorAndAbove).toEqual([LogLevel.ERROR, LogLevel.FATAL]);
    });

    it('should return all levels for lowest threshold', () => {
      const allLevels = LogLevelUtils.getEnabledLevels(LogLevel.TRACE);
      expect(allLevels).toEqual([
        LogLevel.TRACE,
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL,
      ]);
    });

    it('should return only fatal for highest threshold', () => {
      const fatalOnly = LogLevelUtils.getEnabledLevels(LogLevel.FATAL);
      expect(fatalOnly).toEqual([LogLevel.FATAL]);
    });
  });
});
