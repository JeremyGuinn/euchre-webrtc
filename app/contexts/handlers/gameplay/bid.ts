import type { BidMessage } from '../../../types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles BID messages sent by players when placing their bid during the bidding phase.
 * All players receive these messages but only the host processes the bid logic.
 *
 * @param message - The bid message containing the player's bid (suit or pass, with optional alone flag)
 * @param senderId - The ID of the player who placed the bid
 * @param context - Handler context with game state and dispatch functions
 */
export const handleBidMessage: MessageHandler<BidMessage> = (
  message,
  senderId,
  context
) => {
  const { gameState, dispatch } = context;

  const { bid } = message.payload;

  // Validate it's the sender's turn and they're in the game
  if (gameState.currentPlayerId !== senderId) return;

  dispatch({
    type: 'PLACE_BID',
    payload: {
      bid: {
        playerId: senderId,
        suit: bid.suit,
        alone: bid.alone,
      },
    },
  });
};
