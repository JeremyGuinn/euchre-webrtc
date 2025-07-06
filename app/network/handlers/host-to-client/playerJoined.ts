import type { MessageHandler } from '~/types/handlers';
import type { PlayerJoinedMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handlePlayerJoinedImpl: MessageHandler<PlayerJoinedMessage> = (
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
 * Handles PLAYER_JOINED messages broadcast when a new player joins the game.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The player joined message containing the new player and updated game state
 * @param senderId - The ID of the host who broadcast this message
 * @param context - Handler context with game state and dispatch functions
 */
export const handlePlayerJoined = createHostToClientHandler(
  handlePlayerJoinedImpl
);
