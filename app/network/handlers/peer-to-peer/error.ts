import type { PeerToPeerHandler } from '~/types/handlers';
import type { ErrorMessage } from '~/types/messages';

/**
 * Handles ERROR messages sent when something goes wrong during message processing.
 * All players can receive error messages from other players or the host.
 *
 * @param message - The error message containing the error text and optional error code
 * @param senderId - The ID of the player/host who sent the error
 * @param context - Handler context (used to set error state in UI)
 */
export const handleError: PeerToPeerHandler<ErrorMessage> = (
  { payload: { message: errorText, code } },
  senderId,
  context
) => {
  console.error(`Error from ${senderId}:`, errorText, code ? `(${code})` : '');

  // Set the error in the UI state so it can be displayed to the user
  if (context.setError) {
    context.setError(errorText, code);
    context.setConnectionStatus('error');
  }
};
