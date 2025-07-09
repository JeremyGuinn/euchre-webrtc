import * as PeerJS from 'peerjs';
const { PeerError, PeerErrorType } = PeerJS;
/**
 * Utility functions for handling reconnection logic
 */

export const RECONNECTION_CONFIG = {
  // How long to wait for reconnection before giving up
  TIMEOUT_MS: 15000,
  // How long to show reconnecting state before considering it failed
  MAX_RECONNECT_TIME_MS: 30000,
  // Retry configuration for host reconnection
  MAX_RETRIES: 5,
  INITIAL_RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_MULTIPLIER: 1.5,
  // Client polling configuration when host disconnects
  CLIENT_POLL_INTERVAL_MS: 3000,
  CLIENT_POLL_MAX_ATTEMPTS: 10,
  CLIENT_POLL_BACKOFF_MULTIPLIER: 1.2,
} as const;

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

/**
 * Checks if an error appears to be a PeerJS ID conflict
 */
export const isPeerJSIdConflictError = (error: Error): boolean =>
  error instanceof PeerError && error.type === PeerErrorType.UnavailableID;
