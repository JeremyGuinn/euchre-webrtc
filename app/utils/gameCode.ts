/**
 * Game Code Management System
 * 
 * Provides a clean abstraction for generating and managing user-friendly game codes.
 * Game codes are short, easy to type, and avoid confusing characters.
 * 
 * Internal implementation uses a prefix/suffix system to create valid PeerJS IDs
 * while maintaining short, readable codes for users.
 */

// Characters that are easy to read and type, avoiding confusion (no 0/O, 1/I/l, etc.)
const GAME_CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const GAME_CODE_LENGTH = 6;
const PEER_ID_PREFIX = 'euchre-';
const PEER_ID_SUFFIX = '-host';

/**
 * Generates a new random game code
 * @returns A short, user-friendly game code (e.g., "A3K7M2")
 */
export function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < GAME_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * GAME_CODE_CHARS.length);
    code += GAME_CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Converts a user-friendly game code to a PeerJS-compatible host ID
 * @param gameCode - The user-friendly game code
 * @returns A PeerJS-compatible ID for the host
 */
export function gameCodeToHostId(gameCode: string): string {
  return `${PEER_ID_PREFIX}${gameCode.toLowerCase()}${PEER_ID_SUFFIX}`;
}

/**
 * Extracts the game code from a PeerJS host ID
 * @param hostId - The PeerJS host ID
 * @returns The user-friendly game code, or null if invalid
 */
export function hostIdToGameCode(hostId: string): string | null {
  if (!hostId.startsWith(PEER_ID_PREFIX) || !hostId.endsWith(PEER_ID_SUFFIX)) {
    return null;
  }

  const code = hostId.slice(PEER_ID_PREFIX.length, -PEER_ID_SUFFIX.length);
  return code.toUpperCase();
}

/**
 * Validates that a game code has the correct format
 * @param gameCode - The game code to validate
 * @returns True if the game code is valid, false otherwise
 */
export function isValidGameCode(gameCode: string): boolean {
  if (typeof gameCode !== 'string' || gameCode.length !== GAME_CODE_LENGTH) {
    return false;
  }

  // Check that all characters are valid
  for (let i = 0; i < gameCode.length; i++) {
    if (!GAME_CODE_CHARS.includes(gameCode[i].toUpperCase())) {
      return false;
    }
  }

  return true;
}

/**
 * Normalizes a game code to uppercase format
 * @param gameCode - The game code to normalize
 * @returns The normalized game code in uppercase
 */
export function normalizeGameCode(gameCode: string): string {
  return gameCode.toUpperCase().trim();
}
