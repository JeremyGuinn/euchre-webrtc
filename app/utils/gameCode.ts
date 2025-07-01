/**
 * Utility functions for converting between UUIDs (used for peer connections)
 * and user-friendly base64 game codes
 */

/**
 * Converts a UUID to a shortened base64 game code for display to users
 * @param uuid - The UUID string (with or without hyphens)
 * @returns A shortened base64 string without padding
 */
export function uuidToGameCode(uuid: string): string {
  // Remove hyphens from UUID
  const cleanUuid = uuid.replace(/-/g, '');
  
  // Convert hex string to bytes
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(cleanUuid.substr(i * 2, 2), 16);
  }
  
  // Convert bytes to base64 and remove padding
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')  // Make URL safe
    .replace(/\//g, '_')  // Make URL safe
    .replace(/=/g, '');   // Remove padding for shortest form
  
  return base64;
}

/**
 * Converts a base64 game code back to a UUID for peer connections
 * @param gameCode - The base64 game code (with or without padding)
 * @returns The original UUID string with hyphens
 */
export function gameCodeToUuid(gameCode: string): string {
  // Restore URL-safe characters and add padding if needed
  let base64 = gameCode
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Add padding if needed (base64 should be multiple of 4)
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // Convert base64 to bytes
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert bytes to hex string
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Format as UUID with hyphens
  return [
    hex.substr(0, 8),
    hex.substr(8, 4),
    hex.substr(12, 4),
    hex.substr(16, 4),
    hex.substr(20, 12)
  ].join('-');
}

/**
 * Validates that a game code can be converted to a valid UUID
 * @param gameCode - The base64 game code to validate
 * @returns True if the game code is valid, false otherwise
 */
export function isValidGameCode(gameCode: string): boolean {
  try {
    const uuid = gameCodeToUuid(gameCode);
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  } catch (error) {
    return false;
  }
}
