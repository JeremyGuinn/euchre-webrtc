import type { FarmersHandSwapMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles FARMERS_HAND_SWAP messages when a player chooses to swap cards with the kitty.
 * Only the host processes these messages to maintain game state consistency.
 */
export const handleFarmersHandSwap: MessageHandler<FarmersHandSwapMessage> = (
  message,
  senderId,
  context
) => {
  const { gameState, dispatch, isHost } = context;

  if (!isHost) return; // Only host processes farmer's hand swaps

  // Validate game state
  if (gameState.phase !== 'farmers_hand_swap') {
    console.warn(
      'Received FARMERS_HAND_SWAP but not in farmers_hand_swap phase'
    );
    return;
  }

  // Validate sender is the farmer's hand player
  if (gameState.farmersHandPlayer !== senderId) {
    console.warn('Received FARMERS_HAND_SWAP from wrong player');
    return;
  }

  const { cardsToSwap } = message.payload;

  // Validate exactly 3 cards are being swapped
  if (cardsToSwap.length !== 3) {
    console.warn("Farmer's hand swap must involve exactly 3 cards");
    return;
  }

  // Validate player has all the cards they want to swap
  const playerHand = gameState.hands[senderId];
  if (!playerHand) {
    console.warn('Player hand not found');
    return;
  }

  const hasAllCards = cardsToSwap.every(swapCard =>
    playerHand.some(handCard => handCard.id === swapCard.id)
  );

  if (!hasAllCards) {
    console.warn('Player does not have all cards they want to swap');
    return;
  }

  // Dispatch the swap action
  dispatch({
    type: 'FARMERS_HAND_SWAP',
    payload: { playerId: senderId, cardsToSwap },
  });
};
