import type { HostToClientHandler } from '~/types/handlers';
import type { JoinResponseMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handleJoinResponseImpl: HostToClientHandler<JoinResponseMessage> = (
  { payload: { success, gameState: newGameState, player, error } },
  _senderId,
  { gameStore, setConnectionStatus, sessionManager }
) => {
  if (!success || !newGameState || !player) {
    setConnectionStatus('error');
    throw new Error(error || 'Failed to join game');
  }

  // Save session data for reconnection (for clients)
  if (newGameState.gameCode && !player.isHost) {
    sessionManager.saveSession({
      playerId: player.id,
      gameId: newGameState.id,
      gameCode: newGameState.gameCode,
      isHost: false,
      playerName: player.name,
    });
  }

  gameStore.syncState(newGameState, newGameState.playerHand, player.id);

  setConnectionStatus('connected');
};

/**
 * Handles JOIN_RESPONSE messages received after requesting to join a game.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The join response containing success status and game state
 * @param senderId - The ID of the host who sent this response
 * @param context - Handler context with gameStore actions
 */
export const handleJoinResponse = createHostToClientHandler(
  handleJoinResponseImpl,
  [],
  // Skip permission check since this is a response to a join request,
  // and the first time we'll be syncing the game state
  true
);
