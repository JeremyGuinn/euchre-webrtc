import type { HostToClientHandler } from '~/types/handlers';
import type { StartGameMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handleStartGameImpl: HostToClientHandler<StartGameMessage> = (
  { payload: { gameState: newGameState } },
  _senderId,
  { gameStore, myPlayerId }
) => {
  gameStore.syncState(newGameState, newGameState.playerHand, myPlayerId);
};

/**
 * Handles START_GAME messages broadcast by the host when the game begins.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The start game message containing the initial game state
 * @param senderId - The ID of the host who started the game
 * @param context - Handler context with gameStore actions
 */
export const handleStartGame = createHostToClientHandler(handleStartGameImpl);
