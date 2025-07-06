import type { StartGameMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';
import type { MessageHandler } from '../types';

const handleStartGameImpl: MessageHandler<StartGameMessage> = (
  message,
  _senderId,
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

/**
 * Handles START_GAME messages broadcast by the host when the game begins.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The start game message containing the initial game state
 * @param senderId - The ID of the host who started the game
 * @param context - Handler context with dispatch functions
 */
export const handleStartGame = createHostToClientHandler(handleStartGameImpl);
