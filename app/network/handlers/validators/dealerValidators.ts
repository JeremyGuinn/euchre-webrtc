import type { ValidationFunction, ValidationResult } from '~/types/handlers';
import type {
  DealerDiscardMessage,
  DrawDealerCardMessage,
  SetPredeterminedDealerMessage,
} from '~/types/messages';

/**
 * Validates that the sender is actually the current dealer
 */
export const validateSenderIsDealer: ValidationFunction<
  DealerDiscardMessage
> = (_message, senderId, context): ValidationResult => {
  if (context.gameStore.currentDealerId !== senderId) {
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
export const validatePlayerHasNotDrawn: ValidationFunction<
  DrawDealerCardMessage
> = (_message, senderId, context): ValidationResult => {
  if (context.gameStore.dealerSelectionCards?.[senderId]) {
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
export const validateCardsAvailable: ValidationFunction<
  DrawDealerCardMessage
> = (_message, _senderId, context): ValidationResult => {
  const { gameStore } = context;

  if (!gameStore.deck || gameStore.deck.length === 0) {
    return {
      isValid: false,
      reason: 'No deck available',
    };
  }

  const availableCards = gameStore.deck.filter(
    card =>
      !Object.values(gameStore.dealerSelectionCards || {}).some(
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
export const validateDealerExists: ValidationFunction<
  SetPredeterminedDealerMessage
> = (_message, _senderId, context): ValidationResult => {
  const { dealerId } = _message.payload;
  const dealer = context.gameStore.players.find(p => p.id === dealerId);

  if (!dealer) {
    return {
      isValid: false,
      reason: 'Selected dealer does not exist',
    };
  }

  return { isValid: true };
};
