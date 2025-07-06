import type { Player } from '~/types/game';
import type { HandlerContext } from '~/types/handlers';
import type { LeaveGameMessage } from '~/types/messages';
import { createPublicGameState } from '~/utils/gameState';
import { createMessageId } from '~/utils/protocol';
import { createClientToHostHandler } from '../base/clientToHostHandler';

/**
 * Handle a LEAVE_GAME message from a client
 * This is sent by clients before they disconnect to notify the host
 */
const handleLeaveGameImpl = (
  message: LeaveGameMessage,
  senderId: string,
  context: HandlerContext
): void => {
  const { gameState, dispatch, networkManager } = context;

  // Find the player who is leaving
  const leavingPlayer = gameState.players.find(
    (player: Player) => player.id === senderId
  );

  if (!leavingPlayer) {
    // Player not found, they might have already been removed
    return;
  }

  console.log(
    `Player ${leavingPlayer.name} (${senderId}) is leaving the game. Reason: ${message.payload.reason || 'manual'}`
  );

  // Remove the player from the game state
  dispatch({
    type: 'REMOVE_PLAYER',
    payload: { playerId: senderId },
  });

  // Create the updated game state after removing the player
  const updatedGameState = {
    ...gameState,
    players: gameState.players.filter(
      (player: Player) => player.id !== senderId
    ),
  };

  // Create public game state for broadcast
  const publicGameState = createPublicGameState(updatedGameState);

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
