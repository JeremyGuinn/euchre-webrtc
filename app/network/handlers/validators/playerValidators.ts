import type { ValidationFunction, ValidationResult } from '~/types/handlers';
import type {
  FarmersHandDeclineMessage,
  FarmersHandSwapMessage,
  MovePlayerMessage,
  RenameTeamMessage,
} from '~/types/messages';

/**
 * Validates the target player exists
 */
export const validateTargetPlayerExists: ValidationFunction<MovePlayerMessage> = (
  { payload: { targetPlayerId } },
  _senderId,
  { gameStore }
): ValidationResult => {
  const targetPlayerExists = gameStore.players.some(player => player.id === targetPlayerId);

  if (!targetPlayerExists) {
    return {
      isValid: false,
      reason: `Target player ${targetPlayerId} not found`,
    };
  }

  return { isValid: true };
};

/**
 * Validates that the sender is a valid player in the game
 */
export const validatePlayerExists: ValidationFunction = (
  _message,
  senderId,
  context
): ValidationResult => {
  const playerExists = context.gameStore.players.some(player => player.id === senderId);

  if (!playerExists) {
    return {
      isValid: false,
      reason: `Player ${senderId} not found in game`,
    };
  }

  return { isValid: true };
};

/**
 * Validates that it's the sender's turn (for turn-based actions)
 */
export const validatePlayerTurn: ValidationFunction = (
  _message,
  senderId,
  context
): ValidationResult => {
  if (context.gameStore.currentPlayerId !== senderId) {
    return {
      isValid: false,
      reason: `It's not ${senderId}'s turn`,
    };
  }

  return { isValid: true };
};

/**
 * Validates that the player is not already in the game
 */
export const validatePlayerNotAlreadyJoined: ValidationFunction = (
  _message,
  senderId,
  context
): ValidationResult => {
  const playerAlreadyExists = context.gameStore.players.some(player => player.id === senderId);

  if (playerAlreadyExists) {
    return {
      isValid: false,
      reason: 'Player is already in the game',
    };
  }

  return { isValid: true };
};

/**
 * Validates the player can rename the team (must be on the team)
 */
export const validatePlayerCanRenameTeam: ValidationFunction<RenameTeamMessage> = (
  { payload: { teamId } },
  senderId,
  { gameStore }
): ValidationResult => {
  const senderPlayer = gameStore.players.find(p => p.id === senderId);

  if (!senderPlayer || senderPlayer.teamId !== teamId) {
    return {
      isValid: false,
      reason: 'Player can only rename their own team',
    };
  }

  return { isValid: true };
};

/**
 * Validates the sender is the farmer's hand player
 */
export const validateIsFarmersHandPlayer: ValidationFunction<
  FarmersHandSwapMessage | FarmersHandDeclineMessage
> = (_message, senderId, { gameStore }): ValidationResult => {
  if (gameStore.farmersHandPlayer !== senderId) {
    return {
      isValid: false,
      reason: 'Player is not the farmers hand player',
    };
  }

  return { isValid: true };
};
