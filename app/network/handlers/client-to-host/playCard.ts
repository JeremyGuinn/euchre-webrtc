import type { HandlerContext } from '~/types/handlers';
import type { PlayCardMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateCardCanBePlayed,
  validatePlayerExists,
  validatePlayerHasCard,
  validatePlayerTurn,
} from '../validators';

/**
 * Handles PLAY_CARD messages sent by players when playing a card during a trick.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The play card message containing the card being played
 * @param senderId - The ID of the player who played the card
 * @param context - Handler context with game state and dispatch functions
 */
const handlePlayCardMessageImpl = (
  message: PlayCardMessage,
  senderId: string,
  context: HandlerContext
) => {
  const { dispatch } = context;
  const { card } = message.payload;

  dispatch({ type: 'PLAY_CARD', payload: { card, playerId: senderId } });
};

export const handlePlayCardMessage = createClientToHostHandler(
  handlePlayCardMessageImpl,
  [
    validatePlayerExists,
    validatePlayerTurn,
    validatePlayerHasCard,
    validateCardCanBePlayed,
  ]
);
