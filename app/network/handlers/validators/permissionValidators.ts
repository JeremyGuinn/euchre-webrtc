import type { HandlerContext, ValidationResult } from '~/types/handlers';
import type { SetPredeterminedDealerMessage } from '~/types/messages';

/**
 * Validates that the current client is the host and should process client-to-host messages
 */
export const validatePermissionForHost = (
  senderId: string,
  context: HandlerContext
): ValidationResult => {
  if (!context.isHost) {
    return {
      isValid: false,
      reason: 'Only the host can process client-to-host messages',
    };
  }

  // Additional validation: ensure sender is not the host themselves (prevent self-messaging)
  if (senderId === context.myPlayerId) {
    return {
      isValid: false,
      reason: 'Host cannot send client-to-host messages to itself',
    };
  }

  return { isValid: true };
};

/**
 * Validates that the current client is not the host and should process host-to-client messages
 */
export const validatePermissionForClient = (
  senderId: string,
  context: HandlerContext
): ValidationResult => {
  if (context.isHost) {
    return {
      isValid: false,
      reason: 'Host should not process host-to-client messages',
    };
  }

  // Additional validation: ensure the sender is a known player (basic security)
  const sender = context.gameStore.players.find(player => player.id === senderId);

  if (!sender) {
    return {
      isValid: false,
      reason: 'Message sender is not a recognized player',
    };
  }

  const senderIsHost = sender.isHost;
  if (!senderIsHost) {
    return {
      isValid: false,
      reason: 'Message sender is not the host',
    };
  }

  return { isValid: true };
};

/**
 * Validates the sender is the host (additional security check)
 */
export const validateSenderIsHost = (
  senderId: string,
  context: HandlerContext,
  _message: SetPredeterminedDealerMessage
): ValidationResult => {
  const sender = context.gameStore.players.find(p => p.id === senderId);

  if (!sender?.isHost) {
    return {
      isValid: false,
      reason: 'Non-host player attempted to set predetermined dealer',
    };
  }

  return { isValid: true };
};
