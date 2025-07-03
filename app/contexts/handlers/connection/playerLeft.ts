import type { PlayerLeftMessage } from '../../../types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles PLAYER_LEFT messages broadcast when a player leaves the game.
 * All players process these messages to update their local game state.
 *
 * @param message - The player left message containing the player ID and updated game state
 * @param senderId - The ID of the host who broadcast this message
 * @param context - Handler context with dispatch functions
 */
export const handlePlayerLeft: MessageHandler<PlayerLeftMessage> = (
  message,
  senderId,
  context
) => {
  const { dispatch, myPlayerId } = context;

  const { gameState: newGameState } = message.payload;

  dispatch({
    type: 'SYNC_STATE',
    payload: {
      gameState: newGameState,
      playerHand: newGameState.playerHand,
      receivingPlayerId: myPlayerId,
    },
  });
};
