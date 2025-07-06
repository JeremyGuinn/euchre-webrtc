import type { MessageHandler } from '~/types/handlers';
import type { GameStateUpdateMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handleGameStateUpdateImpl: MessageHandler<GameStateUpdateMessage> = (
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
 * Handles GAME_STATE_UPDATE messages broadcast by the host to synchronize game state.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The game state update containing the current game state
 * @param senderId - The ID of the host who sent this update
 * @param context - Handler context with dispatch functions
 */
export const handleGameStateUpdate = createHostToClientHandler(
  handleGameStateUpdateImpl
);
