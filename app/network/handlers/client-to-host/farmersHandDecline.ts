import type { HandlerContext } from '~/types/handlers';
import type { FarmersHandDeclineMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateGameOption,
  validatePlayerExists,
  validateSenderIsFarmersHandPlayer,
} from '../validators';

const handleFarmersHandDeclineImpl = (
  _message: FarmersHandDeclineMessage,
  senderId: string,
  context: HandlerContext
) => {
  const { dispatch } = context;

  dispatch({
    type: 'FARMERS_HAND_DECLINED',
    payload: { playerId: senderId },
  });
};

/**
 * Handles FARMERS_HAND_DECLINE messages when a player chooses not to swap cards.
 * This is a client-to-host message that only the host should process.
 */
export const handleFarmersHandDecline = createClientToHostHandler(
  handleFarmersHandDeclineImpl,
  [
    validatePlayerExists,
    validateGameOption('farmersHand', true),
    validateSenderIsFarmersHandPlayer,
  ]
);
