import type { PlayCardMessage } from '~/types/messages';
import { canPlayCardWithOptions } from '~/utils/gameLogic';
import type { MessageHandler } from '../types';

/**
 * Handles PLAY_CARD messages sent by players when playing a card during a trick.
 * All players receive these messages but only the host processes the card play logic.
 *
 * @param message - The play card message containing the card being played
 * @param senderId - The ID of the player who played the card
 * @param context - Handler context with game state and dispatch functions
 */
export const handlePlayCardMessage: MessageHandler<PlayCardMessage> = (
  message,
  senderId,
  context
) => {
  const { gameState, dispatch } = context;

  const { card } = message.payload;

  // Validate it's the sender's turn and they have the card
  if (gameState.currentPlayerId !== senderId) return;

  const playerHand = gameState.hands[senderId];
  if (!playerHand || !playerHand.some(c => c.id === card.id)) return;

  const leadSuit = gameState.currentTrick?.cards[0]?.card.suit;
  if (
    !canPlayCardWithOptions(
      card,
      playerHand,
      leadSuit,
      gameState.trump,
      gameState.options.allowReneging
    )
  )
    return;

  dispatch({ type: 'PLAY_CARD', payload: { card, playerId: senderId } });
};
