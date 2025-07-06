import type { PeerToPeerHandler } from '~/types/handlers';
import type { HeartbeatMessage } from '~/types/messages';

/**
 * Handles HEARTBEAT messages sent periodically to maintain connection status.
 * These messages help detect when players disconnect or when the connection is unstable.
 *
 * @param message - The heartbeat message containing the game ID
 * @param senderId - The ID of the player who sent the heartbeat
 * @param context - Handler context (could be used for connection status updates)
 */
export const handleHeartbeat: PeerToPeerHandler<HeartbeatMessage> = (
  message,
  senderId
) => {
  // Heartbeat messages are used to maintain connection awareness
  // Log for debugging purposes, but generally no action needed
  console.debug(
    `Received heartbeat from ${senderId} for game ${message.payload.gameId}`
  );

  // Could optionally:
  // - Respond with our own heartbeat
  // - Update connection status or last seen timestamp
  // - Trigger connection health checks
};
