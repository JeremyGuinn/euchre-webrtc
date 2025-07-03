import type { StartGameMessage } from '../../../types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles START_GAME messages broadcast by the host when the game begins.
 * Non-host players process these messages to transition from lobby to game state.
 *
 * @param message - The start game message containing the initial game state
 * @param senderId - The ID of the host who started the game
 * @param context - Handler context with dispatch functions
 */
export const handleStartGame: MessageHandler<StartGameMessage> = (
  message,
  senderId,
  context
) => {
  const { isHost, dispatch, myPlayerId } = context;

  if (isHost) return; // Host doesn't receive start game messages from others

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
