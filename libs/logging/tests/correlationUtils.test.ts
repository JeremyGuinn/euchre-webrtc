import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CorrelationManager,
  PerformanceTimer,
  SessionManager,
} from '../src/utils/correlation.js';

describe('correlationManager', () => {
  beforeEach(() => {
    CorrelationManager.setCurrentId(null);
    CorrelationManager.setIdGenerator(() => 'test-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    CorrelationManager.setCurrentId(null);
    CorrelationManager.setIdGenerator(() => crypto.randomUUID());
  });

  describe('generateId', () => {
    it('should generate a correlation ID using custom generator', () => {
      const id = CorrelationManager.generateId();
      expect(id).toBe('test-id');
    });

    it('should use crypto.randomUUID when available', () => {
      CorrelationManager.setIdGenerator(() => crypto.randomUUID());
      const id = CorrelationManager.generateId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('should fallback to timestamp + random when crypto is not available', () => {
      // @ts-expect-error - Testing fallback
      CorrelationManager.setIdGenerator(null);
      // @ts-expect-error - Testing fallback
      vi.spyOn(globalThis, 'crypto', 'get').mockReturnValue(undefined);

      vi.useFakeTimers();
      const dateNow = Date.now();
      vi.setSystemTime(dateNow);

      const randomValue = 0.123456789; // Fixed random value for testing
      vi.spyOn(Math, 'random').mockReturnValue(randomValue);

      const id = CorrelationManager.generateId();

      expect(id).toBe(
        `${dateNow.toString(36)}-${randomValue.toString(36).substring(2)}`
      );
    });
  });

  describe('getCurrentId and setCurrentId', () => {
    it('should return null when no correlation ID is set', () => {
      expect(CorrelationManager.getCurrentId()).toBeNull();
    });

    it('should return the current correlation ID', () => {
      CorrelationManager.setCurrentId('test-correlation-id');
      expect(CorrelationManager.getCurrentId()).toBe('test-correlation-id');
    });

    it('should allow setting correlation ID to null', () => {
      CorrelationManager.setCurrentId('test-id');
      CorrelationManager.setCurrentId(null);
      expect(CorrelationManager.getCurrentId()).toBeNull();
    });
  });

  describe('withCorrelationId', () => {
    it('should execute function with specified correlation ID', () => {
      let capturedId: string | null = null;

      const result = CorrelationManager.withCorrelationId('test-id', () => {
        capturedId = CorrelationManager.getCurrentId();
        return 'function result';
      });

      expect(capturedId).toBe('test-id');
      expect(result).toBe('function result');
      expect(CorrelationManager.getCurrentId()).toBeNull();
    });

    it('should restore previous correlation ID after execution', () => {
      CorrelationManager.setCurrentId('original-id');

      CorrelationManager.withCorrelationId('temp-id', () => {
        expect(CorrelationManager.getCurrentId()).toBe('temp-id');
      });

      expect(CorrelationManager.getCurrentId()).toBe('original-id');
    });

    it('should restore previous ID even if function throws', () => {
      CorrelationManager.setCurrentId('original-id');

      expect(() => {
        CorrelationManager.withCorrelationId('temp-id', () => {
          throw new Error('test error');
        });
      }).toThrow('test error');

      expect(CorrelationManager.getCurrentId()).toBe('original-id');
    });
  });

  describe('withCorrelationIdAsync', () => {
    it('should execute async function with specified correlation ID', async () => {
      let capturedId: string | null = null;

      const result = await CorrelationManager.withCorrelationIdAsync(
        'async-id',
        async () => {
          capturedId = CorrelationManager.getCurrentId();
          return 'async result';
        }
      );

      expect(capturedId).toBe('async-id');
      expect(result).toBe('async result');
      expect(CorrelationManager.getCurrentId()).toBeNull();
    });

    it('should restore previous correlation ID after async execution', async () => {
      CorrelationManager.setCurrentId('original-id');

      await CorrelationManager.withCorrelationIdAsync('temp-id', async () => {
        expect(CorrelationManager.getCurrentId()).toBe('temp-id');
      });

      expect(CorrelationManager.getCurrentId()).toBe('original-id');
    });

    it('should restore previous ID even if async function rejects', async () => {
      CorrelationManager.setCurrentId('original-id');

      await expect(
        CorrelationManager.withCorrelationIdAsync('temp-id', async () => {
          throw new Error('async error');
        })
      ).rejects.toThrow('async error');

      expect(CorrelationManager.getCurrentId()).toBe('original-id');
    });
  });

  describe('withNewCorrelationId', () => {
    it('should generate new correlation ID and execute function', () => {
      let capturedId: string | null = null;

      const result = CorrelationManager.withNewCorrelationId(() => {
        capturedId = CorrelationManager.getCurrentId();
        return 'new id result';
      });

      expect(capturedId).toBe('test-id');
      expect(result).toBe('new id result');
      expect(CorrelationManager.getCurrentId()).toBeNull();
    });
  });

  describe('withNewCorrelationIdAsync', () => {
    it('should generate new correlation ID and execute async function', async () => {
      let capturedId: string | null = null;

      const result = await CorrelationManager.withNewCorrelationIdAsync(
        async () => {
          capturedId = CorrelationManager.getCurrentId();
          return 'new async id result';
        }
      );

      expect(capturedId).toBe('test-id');
      expect(result).toBe('new async id result');
      expect(CorrelationManager.getCurrentId()).toBeNull();
    });
  });
});

describe('sessionManager', () => {
  beforeEach(() => {
    SessionManager.endSession();
  });

  afterEach(() => {
    SessionManager.endSession();
  });

  describe('startSession', () => {
    it('should start a new session with generated ID', () => {
      const sessionId = SessionManager.startSession();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
      expect(SessionManager.getCurrentSessionId()).toBe(sessionId);
    });

    it('should start a new session with provided ID', () => {
      const customId = 'custom-session-id';
      const sessionId = SessionManager.startSession(customId);
      expect(sessionId).toBe(customId);
      expect(SessionManager.getCurrentSessionId()).toBe(customId);
    });

    it('should track session start time', () => {
      const before = Date.now();
      SessionManager.startSession();
      const after = Date.now();

      const duration = SessionManager.getSessionDuration();
      expect(duration).not.toBeNull();
      expect(duration!).toBeGreaterThanOrEqual(0);
      expect(duration!).toBeLessThanOrEqual(after - before + 10); // Small tolerance
    });
  });

  describe('getCurrentSessionId', () => {
    it('should return null when no session is active', () => {
      expect(SessionManager.getCurrentSessionId()).toBeNull();
    });

    it('should return current session ID', () => {
      SessionManager.startSession('test-session');
      expect(SessionManager.getCurrentSessionId()).toBe('test-session');
    });
  });

  describe('getSessionDuration', () => {
    it('should return null when no session is active', () => {
      expect(SessionManager.getSessionDuration()).toBeNull();
    });

    it('should return session duration', async () => {
      SessionManager.startSession();
      await new Promise(resolve => setTimeout(resolve, 10));

      const duration = SessionManager.getSessionDuration();
      expect(duration).not.toBeNull();
      expect(duration!).toBeGreaterThan(0);
    });
  });

  describe('endSession', () => {
    it('should end the current session', () => {
      SessionManager.startSession('test-session');
      expect(SessionManager.getCurrentSessionId()).toBe('test-session');

      SessionManager.endSession();
      expect(SessionManager.getCurrentSessionId()).toBeNull();
      expect(SessionManager.getSessionDuration()).toBeNull();
    });
  });

  describe('getSessionMetadata', () => {
    it('should return empty metadata when no session is active', () => {
      const metadata = SessionManager.getSessionMetadata();
      expect(metadata).toEqual({});
    });

    it('should return session metadata when session is active', () => {
      SessionManager.startSession('test-session');
      const metadata = SessionManager.getSessionMetadata();

      expect(metadata.sessionId).toBe('test-session');
      expect(metadata.sessionDuration).toBeTypeOf('number');
      expect(metadata.sessionDuration).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('performanceTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with current time', () => {
      const timer = new PerformanceTimer();
      expect(timer).toBeInstanceOf(PerformanceTimer);
    });
  });

  describe('mark', () => {
    it('should record timing marks', () => {
      const timer = new PerformanceTimer();

      vi.advanceTimersByTime(100);
      timer.mark('checkpoint1');

      vi.advanceTimersByTime(50);
      timer.mark('checkpoint2');

      const marks = timer.getMarks();
      expect(marks.checkpoint1).toBe(100);
      expect(marks.checkpoint2).toBe(150);
    });

    it('should allow overwriting marks', () => {
      const timer = new PerformanceTimer();

      vi.advanceTimersByTime(100);
      timer.mark('test');

      vi.advanceTimersByTime(50);
      timer.mark('test'); // Overwrite

      const marks = timer.getMarks();
      expect(marks.test).toBe(150);
    });
  });

  describe('getDuration', () => {
    it('should return elapsed time since creation', () => {
      const timer = new PerformanceTimer();

      vi.advanceTimersByTime(250);

      expect(timer.getDuration()).toBe(250);
    });
  });

  describe('getMetrics', () => {
    it('should return duration and marks', () => {
      const timer = new PerformanceTimer();

      vi.advanceTimersByTime(100);
      timer.mark('test');

      vi.advanceTimersByTime(50);

      const metrics = timer.getMetrics();
      expect(metrics.duration).toBe(150);
      expect(metrics.marks.test).toBe(100);
    });
  });

  describe('measure static method', () => {
    it('should measure synchronous function execution', () => {
      let executed = false;

      const { result, metrics } = PerformanceTimer.measure(() => {
        vi.advanceTimersByTime(100);
        executed = true;
        return 'test result';
      });

      expect(result).toBe('test result');
      expect(executed).toBe(true);
      expect(metrics.duration).toBe(100);
    });

    it('should handle function that throws', () => {
      expect(() => {
        PerformanceTimer.measure(() => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });
  });

  describe('measureAsync static method', () => {
    it('should measure asynchronous function execution', async () => {
      let executed = false;

      const { result, metrics } = await PerformanceTimer.measureAsync(
        async () => {
          await new Promise(resolve => {
            vi.advanceTimersByTime(200);
            resolve(undefined);
          });
          executed = true;
          return 'async result';
        }
      );

      expect(result).toBe('async result');
      expect(executed).toBe(true);
      expect(metrics.duration).toBe(200);
    });

    it('should handle async function that rejects', async () => {
      await expect(
        PerformanceTimer.measureAsync(async () => {
          throw new Error('async error');
        })
      ).rejects.toThrow('async error');
    });
  });

  describe('with real performance API', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('should use performance.now when available', () => {
      const timer = new PerformanceTimer();
      const duration = timer.getDuration();

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(10); // Should be very small
    });

    it('should fallback to Date.now when performance.now is not available', () => {
      const originalPerformance = globalThis.performance;
      // @ts-expect-error - Testing fallback
      globalThis.performance = undefined;

      const timer = new PerformanceTimer();
      const duration = timer.getDuration();

      expect(duration).toBeGreaterThanOrEqual(0);

      globalThis.performance = originalPerformance;
    });
  });
});
