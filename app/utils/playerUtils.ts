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

/**
 * Get the team ID based on player position
 * @param position - Player position (0-3)
 * @returns Team ID (0 or 1)
 */
export function getTeamId(position: number): 0 | 1 {
  return (position % 2) as 0 | 1;
}

/**
 * Get the next player in turn order
 * @param currentPlayerId - Current player's ID
 * @param players - Array of all players
 * @returns Next player's ID
 */
export function getNextPlayer(currentPlayerId: string, players: Player[]): string {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) return players[0]?.id || '';

  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

/**
 * Get the next player in turn order, considering "going alone" rules
 * @param currentPlayerId - Current player's ID
 * @param players - Array of all players
 * @param maker - The player who made trump and whether they're going alone
 * @returns Next player's ID
 */
export function getNextPlayerWithAlone(
  currentPlayerId: string,
  players: Player[],
  maker?: { playerId: string; teamId: 0 | 1; alone: boolean }
): string {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) return players[0]?.id || '';

  // If someone is going alone, skip their teammate
  if (maker?.alone) {
    const makerPlayer = players.find(p => p.id === maker.playerId);
    if (makerPlayer) {
      const teammateId = players.find(
        p => p.teamId === makerPlayer.teamId && p.id !== makerPlayer.id
      )?.id;

      // Find next player, skipping the teammate
      let nextIndex = (currentIndex + 1) % players.length;
      let nextPlayer = players[nextIndex];

      // If the next player is the teammate, skip them
      if (nextPlayer.id === teammateId) {
        nextIndex = (nextIndex + 1) % players.length;
        nextPlayer = players[nextIndex];
      }

      return nextPlayer.id;
    }
  }

  // Normal turn order
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

/**
 * Get the next dealer in turn order
 * @param currentDealerId - Current dealer's ID
 * @param players - Array of all players
 * @returns Next dealer's ID
 */
export function getNextDealer(currentDealerId: string, players: Player[]): string {
  return getNextPlayer(currentDealerId, players);
}
