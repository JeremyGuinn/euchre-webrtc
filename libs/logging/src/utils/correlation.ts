/**
 * Utilities for generating and managing correlation IDs for request tracing
 */
export class CorrelationManager {
  private static currentCorrelationId: string | null = null;
  private static correlationIdGenerator: (() => string) | null = null;

  /**
   * Generate a new correlation ID
   */
  static generateId(): string {
    if (this.correlationIdGenerator) {
      return this.correlationIdGenerator();
    }

    // Default implementation using crypto.randomUUID if available,
    // fallback to timestamp + random for older environments
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback implementation
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  /**
   * Set a custom correlation ID generator
   */
  static setIdGenerator(generator: () => string): void {
    this.correlationIdGenerator = generator;
  }

  /**
   * Get the current correlation ID
   */
  static getCurrentId(): string | null {
    return this.currentCorrelationId;
  }

  /**
   * Set the current correlation ID (for request context)
   */
  static setCurrentId(id: string | null): void {
    this.currentCorrelationId = id;
  }

  /**
   * Execute a function with a specific correlation ID
   */
  static withCorrelationId<T>(id: string, fn: () => T): T {
    const previousId = this.currentCorrelationId;
    this.currentCorrelationId = id;

    try {
      return fn();
    } finally {
      this.currentCorrelationId = previousId;
    }
  }

  /**
   * Execute an async function with a specific correlation ID
   */
  static async withCorrelationIdAsync<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const previousId = this.currentCorrelationId;
    this.currentCorrelationId = id;

    try {
      return await fn();
    } finally {
      this.currentCorrelationId = previousId;
    }
  }

  /**
   * Create a new correlation ID and execute a function with it
   */
  static withNewCorrelationId<T>(fn: () => T): T {
    const id = this.generateId();
    return this.withCorrelationId(id, fn);
  }

  /**
   * Create a new correlation ID and execute an async function with it
   */
  static async withNewCorrelationIdAsync<T>(fn: () => Promise<T>): Promise<T> {
    const id = this.generateId();
    return await this.withCorrelationIdAsync(id, fn);
  }
}

/**
 * Session management utilities for tracking user sessions
 */
export class SessionManager {
  private static currentSessionId: string | null = null;
  private static sessionStartTime: Date | null = null;

  /**
   * Start a new session
   */
  static startSession(sessionId?: string): string {
    const id = sessionId || CorrelationManager.generateId();
    this.currentSessionId = id;
    this.sessionStartTime = new Date();
    return id;
  }

  /**
   * Get the current session ID
   */
  static getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get session duration in milliseconds
   */
  static getSessionDuration(): number | null {
    if (!this.sessionStartTime) {
      return null;
    }
    return Date.now() - this.sessionStartTime.getTime();
  }

  /**
   * End the current session
   */
  static endSession(): void {
    this.currentSessionId = null;
    this.sessionStartTime = null;
  }

  /**
   * Get session metadata
   */
  static getSessionMetadata(): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    if (this.currentSessionId) {
      metadata.sessionId = this.currentSessionId;
    }

    const duration = this.getSessionDuration();
    if (duration !== null) {
      metadata.sessionDuration = duration;
    }

    return metadata;
  }
}

/**
 * Performance timing utilities
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  constructor() {
    this.startTime = this.getCurrentTime();
  }

  /**
   * Get current high-resolution time
   */
  private getCurrentTime(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  /**
   * Mark a specific point in time
   */
  mark(name: string): void {
    this.marks.set(name, this.getCurrentTime() - this.startTime);
  }

  /**
   * Get the duration since the timer was created
   */
  getDuration(): number {
    return this.getCurrentTime() - this.startTime;
  }

  /**
   * Get all marks as a record
   */
  getMarks(): Record<string, number> {
    return Object.fromEntries(this.marks);
  }

  /**
   * Get performance metrics for logging
   */
  getMetrics(): {
    duration: number;
    marks: Record<string, number>;
  } {
    return {
      duration: this.getDuration(),
      marks: this.getMarks(),
    };
  }

  /**
   * Create a timer and execute a function, returning the result and metrics
   */
  static measure<T>(fn: () => T): { result: T; metrics: { duration: number } } {
    const timer = new PerformanceTimer();
    const result = fn();
    return {
      result,
      metrics: { duration: timer.getDuration() },
    };
  }

  /**
   * Create a timer and execute an async function, returning the result and metrics
   */
  static async measureAsync<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; metrics: { duration: number } }> {
    const timer = new PerformanceTimer();
    const result = await fn();
    return {
      result,
      metrics: { duration: timer.getDuration() },
    };
  }
}
