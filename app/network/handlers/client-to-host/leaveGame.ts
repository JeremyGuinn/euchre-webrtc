import type { Player } from '~/types/game';
import type { ClientToHostHandler } from '~/types/handlers';
import type { LeaveGameMessage } from '~/types/messages';
import { createMessageId } from '~/utils/protocol';
import { createClientToHostHandler } from '../base/clientToHostHandler';

/**
 * Handle a LEAVE_GAME message from a client
 * This is sent by clients before they disconnect to notify the host
 */
const handleLeaveGameImpl: ClientToHostHandler<LeaveGameMessage> = (
  message,
  senderId,
  context
): void => {
  const { gameStore, networkManager } = context;

  // Get current game state from store
  const gameState = gameStore;

  // Find the player who is leaving
  const leavingPlayer = gameState.players.find((player: Player) => player.id === senderId);

  if (!leavingPlayer) {
    // Player not found, they might have already been removed
    return;
  }

  // Remove the player from the game state
  gameStore.removePlayer(senderId);

  // Create public game state for broadcast
  const publicGameState = gameStore.createPublicGameState();

  // Notify all remaining players that this player has left
  networkManager.sendMessage({
    type: 'PLAYER_LEFT',
    timestamp: Date.now(),
    messageId: createMessageId(),
    payload: {
      playerId: senderId,
      gameState: publicGameState,
    },
  });

  // Disconnect the peer from the host's perspective
  networkManager.disconnectPeer(senderId);
};

export const handleLeaveGame = createClientToHostHandler(handleLeaveGameImpl);
