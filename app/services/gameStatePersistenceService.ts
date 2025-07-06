import type { GameState } from '~/types/game';

interface PersistedGameState {
  gameState: GameState;
  timestamp: number;
  version: string; // For future migration compatibility
}

export class GameStatePersistenceService {
  private static readonly KEY_PREFIX = 'euchre-game-state-';
  private static readonly VERSION = '1.0.0';
  private static readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  /**
   * Save game state to localStorage (hosts only)
   */
  static saveGameState(gameId: string, gameState: GameState): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    try {
      const persistedState: PersistedGameState = {
        gameState,
        timestamp: Date.now(),
        version: this.VERSION,
      };

      const key = this.getKey(gameId);
      const serialized = JSON.stringify(persistedState);

      window.localStorage.setItem(key, serialized);
      console.log(`Game state saved for ${gameId}`, {
        size: serialized.length,
      });
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   */
  static loadGameState(gameId: string): GameState | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    try {
      const key = this.getKey(gameId);
      const serialized = window.localStorage.getItem(key);

      if (!serialized) {
        return null;
      }

      const persistedState: PersistedGameState = JSON.parse(serialized);

      // Check if the state is too old
      if (Date.now() - persistedState.timestamp > this.TTL_MS) {
        console.log('Game state expired, removing...');
        this.removeGameState(gameId);
        return null;
      }

      // Version compatibility check (for future migrations)
      if (persistedState.version !== this.VERSION) {
        console.warn('Game state version mismatch, removing old state');
        this.removeGameState(gameId);
        return null;
      }

      console.log(`Game state loaded for ${gameId}`);
      return persistedState.gameState;
    } catch (error) {
      console.error('Failed to load game state:', error);
      this.removeGameState(gameId); // Remove corrupted data
      return null;
    }
  }

  /**
   * Remove specific game state
   */
  static removeGameState(gameId: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const key = this.getKey(gameId);
      window.localStorage.removeItem(key);
      console.log(`Game state removed for ${gameId}`);
    } catch (error) {
      console.error('Failed to remove game state:', error);
    }
  }

  /**
   * Check if game state exists for a game ID
   */
  static hasGameState(gameId: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    try {
      const key = this.getKey(gameId);
      const data = window.localStorage.getItem(key);
      if (!data) return false;

      const persistedState: PersistedGameState = JSON.parse(data);

      // Check TTL
      return Date.now() - persistedState.timestamp <= this.TTL_MS;
    } catch {
      return false;
    }
  }

  /**
   * Clean up old/expired game states
   */
  static cleanup(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(this.KEY_PREFIX)) {
          try {
            const data = window.localStorage.getItem(key);
            if (data) {
              const persistedState: PersistedGameState = JSON.parse(data);
              if (Date.now() - persistedState.timestamp > this.TTL_MS) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Remove corrupted entries
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        window.localStorage.removeItem(key);
        console.log('Cleaned up expired game state:', key);
      });

      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired game states`);
      }
    } catch (error) {
      console.error('Failed to cleanup game states:', error);
    }
  }

  /**
   * Get all stored game IDs (for debugging)
   */
  static getStoredGameIds(): string[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];

    const gameIds: string[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(this.KEY_PREFIX)) {
          const gameId = key.replace(this.KEY_PREFIX, '');
          gameIds.push(gameId);
        }
      }
    } catch (error) {
      console.error('Failed to get stored game IDs:', error);
    }
    return gameIds;
  }

  private static getKey(gameId: string): string {
    return `${this.KEY_PREFIX}${gameId}`;
  }
}
