import type { MessageHandler } from '~/types/handlers';
import type { JoinResponseMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handleJoinResponseImpl: MessageHandler<JoinResponseMessage> = (
  message,
  _senderId,
  context
) => {
  const { dispatch, setConnectionStatus } = context;
  const { success, gameState: newGameState, player, error } = message.payload;

  if (!success || !newGameState || !player) {
    setConnectionStatus('error');
    throw new Error(error || 'Failed to join game');
  }

  // Save session data for reconnection (for clients)
  if (newGameState.gameCode && !player.isHost) {
    context.sessionManager.saveSession({
      playerId: player.id,
      gameId: newGameState.id,
      gameCode: newGameState.gameCode,
      isHost: false,
      playerName: player.name,
    });
  }

  dispatch({
    type: 'SYNC_STATE',

    payload: {
      gameState: newGameState,
      playerHand: newGameState.playerHand,
      receivingPlayerId: player.id,
    },
  });

  setConnectionStatus('connected');
};

/**
 * Handles JOIN_RESPONSE messages received after requesting to join a game.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The join response containing success status and game state
 * @param senderId - The ID of the host who sent this response
 * @param context - Handler context with dispatch functions
 */
export const handleJoinResponse = createHostToClientHandler(
  handleJoinResponseImpl,
  [],
  // Skip permission check since this is a response to a join request,
  // and the first time we'll be syncing the game state
  true
);
