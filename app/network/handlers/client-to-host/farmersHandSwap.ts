import type { ClientToHostHandler } from '~/types/handlers';
import type { FarmersHandSwapMessage } from '~/types/messages';
import { getPositionFromPlayerId } from '~/utils/game/playerUtils';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateGameOption,
  validateGamePhase,
  validatePlayerExists,
  validatePlayerHasSwapCards,
  validateSenderIsFarmersHandPlayer,
  validateSwapCardCount,
} from '../validators';

const handleFarmersHandSwapImpl: ClientToHostHandler<FarmersHandSwapMessage> = (
  { payload: { cardsToSwap } },
  senderId,
  { gameStore }
) => {
  const senderPosition = getPositionFromPlayerId(senderId, gameStore.players);
  if (senderPosition === undefined) return;

  gameStore.farmersHandSwap(senderPosition, cardsToSwap);
};

/**
 * Handles FARMERS_HAND_SWAP messages when a player chooses to swap cards with the kitty.
 * This is a client-to-host message that only the host should process.
 */
export const handleFarmersHandSwap = createClientToHostHandler(handleFarmersHandSwapImpl, [
  validatePlayerExists,
  validateGameOption('farmersHand', true),
  validateGamePhase('farmers_hand_swap'),
  validateSenderIsFarmersHandPlayer,
  validateSwapCardCount,
  validatePlayerHasSwapCards,
]);
