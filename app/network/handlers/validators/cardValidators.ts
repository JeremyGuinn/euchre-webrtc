import type { Card } from '~/types/game';
import type { ValidationFunction, ValidationResult } from '~/types/handlers';
import type { FarmersHandSwapMessage, PlayCardMessage } from '~/types/messages';
import { canPlayCardWithOptions, getEffectiveSuit } from '~/utils/game/gameLogic';
import { getPositionFromPlayerId } from '~/utils/game/playerUtils';

/**
 * Validates that the player has the card they're trying to play
 */
export const validatePlayerHasCard: ValidationFunction<PlayCardMessage> = (
  { payload: { card } },
  senderId,
  { gameStore }
): ValidationResult => {
  const senderPosition = getPositionFromPlayerId(senderId, gameStore.players);
  if (senderPosition === undefined) {
    return {
      isValid: false,
      reason: 'Player not found',
    };
  }

  const playerHand = gameStore.hands[senderPosition];

  if (!playerHand || !playerHand.some((c: Card) => c.id === card.id)) {
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
export const validateCardCanBePlayed: ValidationFunction<PlayCardMessage> = (
  { payload: { card } },
  senderId,
  { gameStore }
): ValidationResult => {
  const senderPosition = getPositionFromPlayerId(senderId, gameStore.players);
  if (senderPosition === undefined) {
    return {
      isValid: false,
      reason: 'Player not found',
    };
  }

  const playerHand = gameStore.hands[senderPosition];

  if (!playerHand) {
    return { isValid: false, reason: 'Player hand not found' };
  }

  let effectiveLeadSuit = undefined;
  if (gameStore.currentTrick?.cards[0] && gameStore.trump) {
    effectiveLeadSuit = getEffectiveSuit(gameStore.currentTrick.cards[0].card, gameStore.trump);
  }

  const canPlay = canPlayCardWithOptions(
    card,
    playerHand,
    effectiveLeadSuit,
    gameStore.trump,
    gameStore.options.allowReneging
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
export const validateSwapCardCount: ValidationFunction<FarmersHandSwapMessage> = (
  { payload: { cardsToSwap } },
  _senderId,
  _context
): ValidationResult => {
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
export const validatePlayerHasSwapCards: ValidationFunction<FarmersHandSwapMessage> = (
  { payload: { cardsToSwap } },
  senderId,
  context
): ValidationResult => {
  const senderPosition = getPositionFromPlayerId(senderId, context.gameStore.players);
  if (senderPosition === undefined) {
    return {
      isValid: false,
      reason: 'Player not found',
    };
  }

  const playerHand = context.gameStore.hands[senderPosition];

  if (!playerHand) {
    return {
      isValid: false,
      reason: 'Player hand not found',
    };
  }

  const hasAllCards = cardsToSwap.every(swapCard =>
    playerHand.some((handCard: Card) => handCard.id === swapCard.id)
  );

  if (!hasAllCards) {
    return {
      isValid: false,
      reason: 'Player does not have all cards they want to swap',
    };
  }

  return { isValid: true };
};
