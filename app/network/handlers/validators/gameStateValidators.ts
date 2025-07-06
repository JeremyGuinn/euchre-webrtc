import type {
  JoinRequestMessage,
  RenameTeamMessage,
  SetPredeterminedDealerMessage,
} from '~/types/messages';
import type { HandlerContext, ValidationResult } from '../types';

/**
 * Validates that the game is in the expected phase before processing a message
 */
export const validateGamePhase =
  (expectedPhase: string) =>
  (senderId: string, context: HandlerContext): ValidationResult => {
    if (context.gameState.phase !== expectedPhase) {
      return {
        isValid: false,
        reason: `Cannot process message in phase ${context.gameState.phase}, expected ${expectedPhase}`,
      };
    }

    return { isValid: true };
  };

/**
 * Creates a validator that checks a specific game option has the expected value
 */
export const validateGameOption =
  <T extends keyof HandlerContext['gameState']['options']>(
    optionName: T,
    expectedValue: HandlerContext['gameState']['options'][T]
  ) =>
  (senderId: string, context: HandlerContext): ValidationResult => {
    const optionValue = context.gameState.options[optionName];
    if (optionValue !== expectedValue) {
      return {
        isValid: false,
        reason: `Game option ${optionName} is ${optionValue}, expected ${expectedValue}`,
      };
    }

    return { isValid: true };
  };

/**
 * Validates that the game has space for new players
 */
export const validateGameCapacity = (
  _senderId: string,
  context: HandlerContext,
  _message: JoinRequestMessage
): ValidationResult => {
  const occupiedPositions = new Set(
    context.gameState.players.map(p => p.position)
  );
  const availablePosition = ([0, 1, 2, 3] as const).find(
    pos => !occupiedPositions.has(pos)
  );

  if (availablePosition === undefined) {
    return {
      isValid: false,
      reason: 'Game is full',
    };
  }

  return { isValid: true };
};

/**
 * Validates the team name is acceptable
 */
export const validateTeamName = (
  _senderId: string,
  _context: HandlerContext,
  message: RenameTeamMessage
): ValidationResult => {
  const { newName } = message.payload;
  const sanitizedName = newName.trim();

  if (!sanitizedName || sanitizedName.length > 50) {
    return {
      isValid: false,
      reason: 'Team name is invalid or too long',
    };
  }

  return { isValid: true };
};

/**
 * Validates predetermined dealer selection is enabled
 */
export const validatePredeterminedDealerEnabled = (
  _senderId: string,
  context: HandlerContext,
  _message: SetPredeterminedDealerMessage
): ValidationResult => {
  if (
    context.gameState.options.dealerSelection !== 'predetermined_first_dealer'
  ) {
    return {
      isValid: false,
      reason: 'Predetermined dealer selection is not enabled',
    };
  }

  return { isValid: true };
};

/**
 * Creates a validator that checks if the sender has a specific role or property
 */
export const validateSenderIs =
  (
    checkFn: (senderId: string, context: HandlerContext) => boolean,
    errorMessage: string
  ) =>
  (senderId: string, context: HandlerContext): ValidationResult => {
    if (!checkFn(senderId, context)) {
      return {
        isValid: false,
        reason: errorMessage,
      };
    }

    return { isValid: true };
  };

/**
 * Specific sender validators using the generic validateSenderIs
 */
export const validateSenderIsHost = validateSenderIs((senderId, context) => {
  const sender = context.gameState.players.find(p => p.id === senderId);
  return sender?.isHost === true;
}, 'Non-host player attempted to perform host-only action');

export const validateSenderIsDealer = validateSenderIs(
  (senderId, context) => context.gameState.currentDealerId === senderId,
  'Received action from non-dealer player'
);

export const validateSenderIsFarmersHandPlayer = validateSenderIs(
  (senderId, context) => context.gameState.farmersHandPlayer === senderId,
  'Received action from non-farmers-hand player'
);
