import type { DealCardsMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles DEAL_CARDS messages sent by the host to distribute cards to players.
 * Non-host players process these messages to receive their hand and see the kitty card.
 *
 * @param message - The deal cards message containing the player's hand and kitty card
 * @param senderId - The ID of the host who dealt the cards
 * @param context - Handler context with player ID for logging
 */
export const handleDealCards: MessageHandler<DealCardsMessage> = (
  message,
  senderId,
  context
) => {
  const { isHost, myPlayerId } = context;

  if (isHost) return; // Host doesn't receive deal cards messages from others

  const { hand, kitty } = message.payload;

  // In a real implementation, this would update the player's hand in the game state
  // For now, we'll just log it since this message type might need additional state management
  console.debug(`Received cards for player ${myPlayerId}:`, { hand, kitty });

  // This handler would need to be implemented based on the actual game state management
  // The DEAL_CARDS message might need to include the full game state or be handled differently
};
