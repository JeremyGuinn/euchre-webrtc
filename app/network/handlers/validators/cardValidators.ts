import type { FarmersHandSwapMessage, PlayCardMessage } from '~/types/messages';
import { canPlayCardWithOptions, getEffectiveSuit } from '~/utils/gameLogic';
import type { HandlerContext, ValidationResult } from '../types';

/**
 * Validates that the player has the card they're trying to play
 */
export const validatePlayerHasCard = (
  senderId: string,
  context: HandlerContext,
  message: PlayCardMessage
): ValidationResult => {
  const playerHand = context.gameState.hands[senderId];
  const { card } = message.payload;

  if (!playerHand || !playerHand.some(c => c.id === card.id)) {
    return {
      isValid: false,
      reason: 'Player does not have the card they are trying to play',
    };
  }

  return { isValid: true };
};

/**
 * Validates that the card can be legally played according to game rules
 */
export const validateCardCanBePlayed = (
  senderId: string,
  context: HandlerContext,
  message: PlayCardMessage
): ValidationResult => {
  const { gameState } = context;
  const { card } = message.payload;
  const playerHand = gameState.hands[senderId];

  if (!playerHand) {
    return { isValid: false, reason: 'Player hand not found' };
  }

  let effectiveLeadSuit = undefined;
  if (gameState.currentTrick?.cards[0] && gameState.trump) {
    effectiveLeadSuit = getEffectiveSuit(
      gameState.currentTrick.cards[0].card,
      gameState.trump
    );
  }

  const canPlay = canPlayCardWithOptions(
    card,
    playerHand,
    effectiveLeadSuit,
    gameState.trump,
    gameState.options.allowReneging
  );

  if (!canPlay) {
    return {
      isValid: false,
      reason: 'Card cannot be played according to game rules',
    };
  }

  return { isValid: true };
};

/**
 * Validates the swap involves exactly 3 cards
 */
export const validateSwapCardCount = (
  senderId: string,
  context: HandlerContext,
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
export const validatePlayerHasSwapCards = (
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
