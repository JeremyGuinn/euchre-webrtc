/**
 * Utility functions for handling reconnection logic
 */

export const RECONNECTION_CONFIG = {
  // How long to wait for reconnection before giving up
  TIMEOUT_MS: 15000,
  // How long to show reconnecting state before considering it failed
  MAX_RECONNECT_TIME_MS: 30000,
} as const;

/**
 * Wraps a promise with a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Checks if a session should be considered for automatic reconnection
 */
export function shouldAttemptAutoReconnection(sessionData: {
  lastConnectionTime: number;
}): boolean {
  const timeSinceLastConnection = Date.now() - sessionData.lastConnectionTime;

  // Only attempt auto-reconnection if less than 5 minutes have passed
  return timeSinceLastConnection < 5 * 60 * 1000;
}
