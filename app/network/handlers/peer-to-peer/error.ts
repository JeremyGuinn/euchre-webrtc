import type { PeerToPeerHandler } from '~/types/handlers';
import type { ErrorMessage } from '~/types/messages';

/**
 * Handles ERROR messages sent when something goes wrong during message processing.
 * All players can receive error messages from other players or the host.
 *
 * @param message - The error message containing the error text and optional error code
 * @param senderId - The ID of the player/host who sent the error
 * @param context - Handler context (not used for error handling currently)
 */
export const handleError: PeerToPeerHandler<ErrorMessage> = (
  { payload: { message: errorText, code } },
  senderId
) => {
  console.error(`Error from ${senderId}:`, errorText, code ? `(${code})` : '');

  // You could dispatch an action here to show errors in the UI
  // For now, just log the error for debugging purposes
};
