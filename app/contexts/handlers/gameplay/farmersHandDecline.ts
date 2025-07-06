import type { FarmersHandDeclineMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles FARMERS_HAND_DECLINE messages when a player chooses not to swap cards.
 * Only the host processes these messages to maintain game state consistency.
 */
export const handleFarmersHandDecline: MessageHandler<
  FarmersHandDeclineMessage
> = (message, senderId, context) => {
  const { gameState, dispatch, isHost } = context;

  if (!isHost) return; // Only host processes farmer's hand declines

  // Validate game state
  if (gameState.phase !== 'farmers_hand_swap') {
    console.warn(
      'Received FARMERS_HAND_DECLINE but not in farmers_hand_swap phase'
    );
    return;
  }

  // Validate sender is the farmer's hand player
  if (gameState.farmersHandPlayer !== senderId) {
    console.warn('Received FARMERS_HAND_DECLINE from wrong player');
    return;
  }

  // Dispatch the decline action
  dispatch({
    type: 'FARMERS_HAND_DECLINED',
    payload: { playerId: senderId },
  });
};
