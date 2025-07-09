import type { Player } from '~/types/game';

/**
 * Ensures a player name is unique among existing players by appending a number if needed
 * @param desiredName - The name the player wants to use
 * @param existingPlayers - Array of existing players
 * @param excludePlayerId - Optional player ID to exclude from duplicate checking (for renaming)
 * @returns A unique name
 */
export function makeNameUnique(
  desiredName: string,
  existingPlayers: Player[],
  excludePlayerId?: string
): string {
  const trimmedName = desiredName.trim();
  if (!trimmedName) {
    return 'Player';
  }

  // Filter out the player being renamed if applicable
  const playersToCheck = excludePlayerId
    ? existingPlayers.filter(p => p.id !== excludePlayerId)
    : existingPlayers;

  // Check if the name is already unique
  const isNameTaken = playersToCheck.some(
    player => player.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (!isNameTaken) {
    return trimmedName;
  }

  // Find a unique name by appending a number
  let counter = 2;
  let uniqueName = `${trimmedName} (${counter})`;

  while (playersToCheck.some(player => player.name.toLowerCase() === uniqueName.toLowerCase())) {
    counter++;
    uniqueName = `${trimmedName} (${counter})`;
  }

  return uniqueName;
}
