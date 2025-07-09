import type { ClientToHostHandler } from '~/types/handlers';
import type { BidMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import { validatePlayerExists, validatePlayerTurn } from '../validators';

const handleBidMessageImpl: ClientToHostHandler<BidMessage> = (
  { payload: { bid } },
  senderId,
  { gameStore }
) => {
  gameStore.placeBid({
    playerId: senderId,
    suit: bid.suit,
    alone: bid.alone,
  });
};

/**
 * Handles BID messages sent by players when placing their bid during the bidding phase.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The bid message containing the player's bid (suit or pass, with optional alone flag)
 * @param senderId - The ID of the player who placed the bid
 * @param context - Handler context with game state and gameStore actions
 */
export const handleBidMessage = createClientToHostHandler(
  handleBidMessageImpl,
  [validatePlayerExists, validatePlayerTurn]
);
