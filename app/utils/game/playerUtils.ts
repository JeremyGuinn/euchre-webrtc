import type { Player, PositionIndex, TeamIndex } from '~/types/game';

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

/**
 * Get the team ID based on player position
 * @param position - Player position (0-3)
 * @returns Team ID (0 or 1)
 */
export function getTeamId(position: PositionIndex): TeamIndex {
  return (position % 2) as TeamIndex;
}

/**
 * Get the next player position in turn order
 * @param currentPosition - Current player's position
 * @returns Next player's position
 */
export function getNextPlayerPosition(currentPosition: PositionIndex): PositionIndex {
  return ((currentPosition + 1) % 4) as PositionIndex;
}

/**
 * Get the next player position in turn order, considering "going alone" rules
 * @param currentPosition - Current player's position
 * @param maker - The player who made trump and whether they're going alone
 * @returns Next player's position
 */
export function getNextPlayerPositionWithAlone(
  currentPosition: PositionIndex,
  maker?: { playerPosition: PositionIndex; teamId: TeamIndex; alone: boolean }
): PositionIndex {
  // If someone is going alone, skip their teammate
  if (maker?.alone) {
    const makerTeamId = maker.teamId;

    // Find next position, skipping the teammate
    let nextPosition = getNextPlayerPosition(currentPosition);

    // If the next position is the teammate, skip them
    const nextPlayerTeamId = getTeamId(nextPosition);
    if (nextPlayerTeamId === makerTeamId && nextPosition !== maker.playerPosition) {
      nextPosition = getNextPlayerPosition(nextPosition);
    }

    return nextPosition;
  }

  // Normal turn order
  return getNextPlayerPosition(currentPosition);
}

/**
 * Get the next dealer position in turn order
 * @param currentDealerPosition - Current dealer's position
 * @returns Next dealer's position
 */
export function getNextDealerPosition(currentDealerPosition: PositionIndex): PositionIndex {
  return getNextPlayerPosition(currentDealerPosition);
}

/**
 * Get player ID from position
 * @param position - Player position
 * @param players - Array of all players
 * @returns Player ID at that position, or undefined if no player
 */
export function getPlayerIdFromPosition(
  position: PositionIndex,
  players: Player[]
): string | undefined {
  return players.find(p => p.position === position)?.id;
}

/**
 * Get player from position
 * @param position - Player position
 * @param players - Array of all players
 * @returns Player at that position, or undefined if no player
 */
export function getPlayerFromPosition(
  position: PositionIndex,
  players: Player[]
): Player | undefined {
  return players.find(p => p.position === position);
}

/**
 * Get position from player ID
 * @param playerId - Player ID
 * @param players - Array of all players
 * @returns Player position, or undefined if player not found
 */
export function getPositionFromPlayerId(
  playerId: string | undefined,
  players: Player[]
): PositionIndex | undefined {
  return players.find(p => p.id === playerId)?.position;
}

/**
 * Check if a position has a player
 * @param position - Player position
 * @param players - Array of all players
 * @returns True if position is occupied
 */
export function isPositionOccupied(position: PositionIndex, players: Player[]): boolean {
  return players.some(p => p.position === position);
}
