import type { SetPredeterminedDealerMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import type { HandlerContext } from '../types';
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
 * @param context - Handler context with dispatch functions
 */
const handleSetPredeterminedDealerImpl = (
  message: SetPredeterminedDealerMessage,
  senderId: string,
  context: HandlerContext
) => {
  const { dispatch, gameState } = context;
  const { dealerId } = message.payload;

  const updatedOptions = {
    ...gameState.options,
    predeterminedFirstDealerId: dealerId,
  };

  dispatch({
    type: 'UPDATE_GAME_OPTIONS',
    payload: { options: updatedOptions },
  });
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
