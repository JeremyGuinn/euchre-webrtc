import type {
  HandlerContext,
  ValidationFunction,
  ValidationResult,
} from '~/types/handlers';
import type {
  BaseMessage,
  JoinRequestMessage,
  RenameTeamMessage,
  SetPredeterminedDealerMessage,
} from '~/types/messages';

/**
 * Validates that the game is in the expected phase before processing a message
 */
export const validateGamePhase =
  <T extends BaseMessage>(expectedPhase: string): ValidationFunction<T> =>
  (_message, _senderId, context) => {
    if (context.gameStore.phase !== expectedPhase) {
      return {
        isValid: false,
        reason: `Cannot process message in phase ${context.gameStore.phase}, expected ${expectedPhase}`,
      };
    }

    return { isValid: true };
  };

/**
 * Creates a validator that checks a specific game option has the expected value
 */
export const validateGameOption =
  <
    U extends BaseMessage,
    T extends keyof HandlerContext['gameStore']['options'],
  >(
    optionName: T,
    expectedValue: HandlerContext['gameStore']['options'][T]
  ): ValidationFunction<U> =>
  (_message, _senderId, context): ValidationResult => {
    const optionValue = context.gameStore.options[optionName];
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
export const validateGameCapacity: ValidationFunction<JoinRequestMessage> = (
  _message,
  _senderId,
  context
): ValidationResult => {
  const occupiedPositions = new Set(
    context.gameStore.players.map(p => p.position)
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
export const validateTeamName: ValidationFunction<RenameTeamMessage> = (
  { payload: { newName } },
  _senderId,
  _context
): ValidationResult => {
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
export const validatePredeterminedDealerEnabled: ValidationFunction<
  SetPredeterminedDealerMessage
> = (_message, _senderId, context): ValidationResult => {
  if (
    context.gameStore.options.dealerSelection !== 'predetermined_first_dealer'
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
  ): ValidationFunction =>
  (_message, senderId, context): ValidationResult => {
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
  const sender = context.gameStore.players.find(p => p.id === senderId);
  return sender?.isHost === true;
}, 'Non-host player attempted to perform host-only action');

export const validateSenderIsDealer = validateSenderIs(
  (senderId, context) => context.gameStore.currentDealerId === senderId,
  'Received action from non-dealer player'
);

export const validateSenderIsFarmersHandPlayer = validateSenderIs(
  (senderId, context) => context.gameStore.farmersHandPlayer === senderId,
  'Received action from non-farmers-hand player'
);
