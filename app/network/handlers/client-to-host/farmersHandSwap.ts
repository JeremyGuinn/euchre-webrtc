import type { HandlerContext, ValidationResult } from '~/types/handlers';
import type { FarmersHandSwapMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateGameOption,
  validateGamePhase,
  validatePlayerExists,
  validateSenderIsFarmersHandPlayer,
} from '../validators';

/**
 * Validates the swap involves exactly 3 cards
 */
const validateSwapCardCount = (
  _senderId: string,
  _context: HandlerContext,
  message: FarmersHandSwapMessage
): ValidationResult => {
  const { cardsToSwap } = message.payload;

  if (cardsToSwap.length !== 3) {
    return {
      isValid: false,
      reason: "Farmer's hand swap must involve exactly 3 cards",
    };
  }

  return { isValid: true };
};

/**
 * Validates the player has all the cards they want to swap
 */
const validatePlayerHasSwapCards = (
  senderId: string,
  context: HandlerContext,
  message: FarmersHandSwapMessage
): ValidationResult => {
  const { cardsToSwap } = message.payload;
  const playerHand = context.gameState.hands[senderId];

  if (!playerHand) {
    return {
      isValid: false,
      reason: 'Player hand not found',
    };
  }

  const hasAllCards = cardsToSwap.every(swapCard =>
    playerHand.some(handCard => handCard.id === swapCard.id)
  );

  if (!hasAllCards) {
    return {
      isValid: false,
      reason: 'Player does not have all cards they want to swap',
    };
  }

  return { isValid: true };
};

const handleFarmersHandSwapImpl = (
  message: FarmersHandSwapMessage,
  senderId: string,
  context: HandlerContext
) => {
  const { dispatch } = context;
  const { cardsToSwap } = message.payload;

  dispatch({
    type: 'FARMERS_HAND_SWAP',
    payload: { playerId: senderId, cardsToSwap },
  });
};

/**
 * Handles FARMERS_HAND_SWAP messages when a player chooses to swap cards with the kitty.
 * This is a client-to-host message that only the host should process.
 */
export const handleFarmersHandSwap = createClientToHostHandler(
  handleFarmersHandSwapImpl,
  [
    validatePlayerExists,
    validateGameOption('farmersHand', true),
    validateGamePhase('farmers_hand_swap'),
    validateSenderIsFarmersHandPlayer,
    validateSwapCardCount,
    validatePlayerHasSwapCards,
  ]
);
