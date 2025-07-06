import type {
  FarmersHandDeclineMessage,
  FarmersHandSwapMessage,
  JoinRequestMessage,
  RenameTeamMessage,
} from '~/types/messages';
import type { HandlerContext, ValidationResult } from '../types';

/**
 * Validates that the sender is a valid player in the game
 */
export const validatePlayerExists = (
  senderId: string,
  context: HandlerContext
): ValidationResult => {
  const playerExists = context.gameState.players.some(
    player => player.id === senderId
  );

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
export const validatePlayerTurn = (
  senderId: string,
  context: HandlerContext
): ValidationResult => {
  if (context.gameState.currentPlayerId !== senderId) {
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
export const validatePlayerNotAlreadyJoined = (
  senderId: string,
  context: HandlerContext,
  _message: JoinRequestMessage
): ValidationResult => {
  const playerAlreadyExists = context.gameState.players.some(
    player => player.id === senderId
  );

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
export const validatePlayerCanRenameTeam = (
  senderId: string,
  context: HandlerContext,
  message: RenameTeamMessage
): ValidationResult => {
  const { teamId } = message.payload;
  const senderPlayer = context.gameState.players.find(p => p.id === senderId);

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
export const validateIsFarmersHandPlayer = (
  senderId: string,
  context: HandlerContext,
  _message: FarmersHandSwapMessage | FarmersHandDeclineMessage
): ValidationResult => {
  if (context.gameState.farmersHandPlayer !== senderId) {
    return {
      isValid: false,
      reason: 'Player is not the farmers hand player',
    };
  }

  return { isValid: true };
};
