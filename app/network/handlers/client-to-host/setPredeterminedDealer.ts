import type { ClientToHostHandler } from '~/types/handlers';
import type { SetPredeterminedDealerMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateDealerExists,
  validateGameOption,
  validateGamePhase,
  validatePlayerExists,
  validateSenderIsHost,
} from '../validators';

/**
 * Handles SET_PREDETERMINED_DEALER messages sent when the host selects a predetermined dealer.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The set predetermined dealer message containing the dealer ID
 * @param senderId - The ID of the player who sent the message (should be the host)
 * @param context - Handler context with gameStore actions
 */
const handleSetPredeterminedDealerImpl: ClientToHostHandler<SetPredeterminedDealerMessage> = (
  message,
  _senderId,
  context
) => {
  const { gameStore } = context;
  const { dealerId } = message.payload;

  // Get current game state from store
  const gameState = gameStore;

  const updatedOptions = {
    ...gameState.options,
    predeterminedFirstDealerId: dealerId,
  };

  gameStore.updateGameOptions(updatedOptions);
};

export const handleSetPredeterminedDealer = createClientToHostHandler(
  handleSetPredeterminedDealerImpl,
  [
    validatePlayerExists,
    validateSenderIsHost,
    validateGamePhase('lobby'),
    validateGameOption('dealerSelection', 'predetermined_first_dealer'),
    validateDealerExists,
  ]
);
