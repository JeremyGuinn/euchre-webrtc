import type { SetPredeterminedDealerMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles SET_PREDETERMINED_DEALER messages sent when the host selects a predetermined dealer.
 * All players receive these messages to update their game options.
 *
 * @param message - The set predetermined dealer message containing the dealer ID
 * @param senderId - The ID of the player who sent the message (should be the host)
 * @param context - Handler context with dispatch functions
 */
export const handleSetPredeterminedDealer: MessageHandler<
  SetPredeterminedDealerMessage
> = (message, senderId, context) => {
  const { dispatch, gameState } = context;

  const { dealerId } = message.payload;

  // Validate that the sender is the host
  const sender = gameState.players.find(p => p.id === senderId);
  if (!sender?.isHost) {
    console.warn('Non-host player attempted to set predetermined dealer');
    return;
  }

  // Validate that the game is in lobby phase
  if (gameState.phase !== 'lobby') {
    console.warn(
      'Attempted to set predetermined dealer outside of lobby phase'
    );
    return;
  }

  // Validate that dealer selection is set to predetermined
  if (gameState.options.dealerSelection !== 'predetermined_first_dealer') {
    console.warn(
      'Attempted to set predetermined dealer when not using predetermined dealer selection'
    );
    return;
  }

  // Validate that the dealer exists
  const dealer = gameState.players.find(p => p.id === dealerId);
  if (!dealer) {
    console.warn('Attempted to set invalid player as predetermined dealer');
    return;
  }

  // Update the game options with the selected dealer
  const updatedOptions = {
    ...gameState.options,
    predeterminedFirstDealerId: dealerId,
  };

  dispatch({
    type: 'UPDATE_GAME_OPTIONS',
    payload: { options: updatedOptions },
  });
};
