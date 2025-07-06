import type { BidMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import type { MessageHandler } from '../types';
import { validatePlayerExists, validatePlayerTurn } from '../validators';

const handleBidMessageImpl: MessageHandler<BidMessage> = (
  message,
  senderId,
  context
) => {
  const { dispatch } = context;
  const { bid } = message.payload;

  dispatch({
    type: 'PLACE_BID',
    payload: {
      bid: {
        playerId: senderId,
        suit: bid.suit,
        alone: bid.alone,
      },
    },
  });
};

/**
 * Handles BID messages sent by players when placing their bid during the bidding phase.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The bid message containing the player's bid (suit or pass, with optional alone flag)
 * @param senderId - The ID of the player who placed the bid
 * @param context - Handler context with game state and dispatch functions
 */
export const handleBidMessage = createClientToHostHandler(
  handleBidMessageImpl,
  [validatePlayerExists, validatePlayerTurn]
);
