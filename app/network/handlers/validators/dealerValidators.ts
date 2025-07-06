import type {
  DealerDiscardMessage,
  DrawDealerCardMessage,
  SetPredeterminedDealerMessage,
} from '~/types/messages';
import type { HandlerContext, ValidationResult } from '../types';

/**
 * Validates that the sender is actually the current dealer
 */
export const validateSenderIsDealer = (
  senderId: string,
  context: HandlerContext,
  _message: DealerDiscardMessage
): ValidationResult => {
  if (context.gameState.currentDealerId !== senderId) {
    return {
      isValid: false,
      reason: `Received dealer discard from non-dealer player ${senderId}`,
    };
  }

  return { isValid: true };
};

/**
 * Validates that the player hasn't already drawn a card
 */
export const validatePlayerHasNotDrawn = (
  senderId: string,
  context: HandlerContext,
  _message: DrawDealerCardMessage
): ValidationResult => {
  if (context.gameState.dealerSelectionCards?.[senderId]) {
    return {
      isValid: false,
      reason: 'Player has already drawn a card',
    };
  }

  return { isValid: true };
};

/**
 * Validates that there are cards available to draw
 */
export const validateCardsAvailable = (
  senderId: string,
  context: HandlerContext,
  _message: DrawDealerCardMessage
): ValidationResult => {
  const { gameState } = context;

  if (!gameState.deck || gameState.deck.length === 0) {
    return {
      isValid: false,
      reason: 'No deck available',
    };
  }

  const availableCards = gameState.deck.filter(
    card =>
      !Object.values(gameState.dealerSelectionCards || {}).some(
        drawnCard => drawnCard.id === card.id
      )
  );

  if (availableCards.length === 0) {
    return {
      isValid: false,
      reason: 'No cards available to draw',
    };
  }

  return { isValid: true };
};

/**
 * Validates the selected dealer exists
 */
export const validateDealerExists = (
  senderId: string,
  context: HandlerContext,
  message: SetPredeterminedDealerMessage
): ValidationResult => {
  const { dealerId } = message.payload;
  const dealer = context.gameState.players.find(p => p.id === dealerId);

  if (!dealer) {
    return {
      isValid: false,
      reason: 'Selected dealer does not exist',
    };
  }

  return { isValid: true };
};
