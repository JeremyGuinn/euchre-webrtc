import type { HostToClientHandler } from '~/types/handlers';
import type { SelectDealerMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handleSelectDealerImpl: HostToClientHandler<SelectDealerMessage> = (
  { payload: { gameState: newGameState } },
  _senderId,
  { gameStore, myPlayerId }
) => {
  gameStore.syncState(newGameState, newGameState.playerHand, myPlayerId);
};

/**
 * Handles SELECT_DEALER messages broadcast by the host when dealer selection begins.
 * All players receive this message to transition to the dealer selection phase.
 *
 * @param message - The select dealer message containing the game state
 * @param senderId - The ID of the host who initiated dealer selection
 * @param context - Handler context with gameStore actions
 */
export const handleSelectDealer = createHostToClientHandler(
  handleSelectDealerImpl
);
