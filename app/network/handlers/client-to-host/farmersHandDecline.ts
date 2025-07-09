import type { ClientToHostHandler } from '~/types/handlers';
import type { FarmersHandDeclineMessage } from '~/types/messages';
import { getPositionFromPlayerId } from '~/utils/game/playerUtils';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateGameOption,
  validatePlayerExists,
  validateSenderIsFarmersHandPlayer,
} from '../validators';

const handleFarmersHandDeclineImpl: ClientToHostHandler<FarmersHandDeclineMessage> = (
  _message,
  senderId,
  { gameStore }
) => {
  const senderPosition = getPositionFromPlayerId(senderId, gameStore.players);
  if (senderPosition === undefined) return;

  gameStore.farmersHandDeclined(senderPosition);
};

/**
 * Handles FARMERS_HAND_DECLINE messages when a player chooses not to swap cards.
 * This is a client-to-host message that only the host should process.
 */
export const handleFarmersHandDecline = createClientToHostHandler(handleFarmersHandDeclineImpl, [
  validatePlayerExists,
  validateGameOption('farmersHand', true),
  validateSenderIsFarmersHandPlayer,
]);
