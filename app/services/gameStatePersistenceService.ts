import type { GameState } from '~/types/game';
import { createScopedLogger } from './loggingService';

interface PersistedGameState {
  gameState: GameState;
  timestamp: number;
  version: string; // For future migration compatibility
}

export class GameStatePersistenceService {
  private static readonly KEY_PREFIX = 'euchre-game-state-';
  private static readonly VERSION = '1.0.0';
  private static readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
  private static logger = createScopedLogger('GameStatePersistenceService');

  /**
   * Save game state to localStorage (hosts only)
   */
  static saveGameState(gameId: string, gameState: GameState): boolean {
    this.logger.trace('Attempting to save game state', { gameId });

    if (typeof window === 'undefined' || !window.localStorage) {
      this.logger.debug('Local storage not available for game state save');
      return false;
    }

    try {
      const persistedState: PersistedGameState = {
        gameState,
        timestamp: Date.now(),
        version: this.VERSION,
      };

      const key = this.getKey(gameId);
      const serialized = JSON.stringify(persistedState);

      window.localStorage.setItem(key, serialized);

      this.logger.info('Game state saved successfully', {
        gameId,
        gamePhase: gameState.phase,
        playerCount: gameState.players.length,
        dataSize: Math.round((serialized.length / 1024) * 100) / 100, // KB with 2 decimal places
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to save game state', {
        gameId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Load game state from localStorage
   */
  static loadGameState(gameId: string): GameState | null {
    this.logger.trace('Attempting to load game state', { gameId });

    if (typeof window === 'undefined' || !window.localStorage) {
      this.logger.debug('Local storage not available for game state load');
      return null;
    }

    try {
      const key = this.getKey(gameId);
      const serialized = window.localStorage.getItem(key);

      if (!serialized) {
        this.logger.debug('No persisted game state found', { gameId });
        return null;
      }

      const persistedState: PersistedGameState = JSON.parse(serialized);
      const timeSinceLastSave = Date.now() - persistedState.timestamp;

      // Check if the state is too old
      if (timeSinceLastSave > this.TTL_MS) {
        this.logger.info('Game state expired, removing from storage', {
          gameId,
          ageDays:
            Math.round((timeSinceLastSave / (1000 * 60 * 60 * 24)) * 100) / 100,
          ttlHours: this.TTL_MS / (1000 * 60 * 60),
        });
        this.removeGameState(gameId);
        return null;
      }

      // Version compatibility check (for future migrations)
      if (persistedState.version !== this.VERSION) {
        this.logger.warn(
          'Game state version mismatch, removing incompatible data',
          {
            gameId,
            persistedVersion: persistedState.version,
            currentVersion: this.VERSION,
          }
        );
        this.removeGameState(gameId);
        return null;
      }

      this.logger.info('Game state loaded successfully', {
        gameId,
        gamePhase: persistedState.gameState.phase,
        playerCount: persistedState.gameState.players.length,
        ageMinutes: Math.round(timeSinceLastSave / (1000 * 60)),
      });

      return persistedState.gameState;
    } catch (error) {
      this.logger.error('Failed to load game state, removing corrupted data', {
        gameId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.removeGameState(gameId); // Remove corrupted data
      return null;
    }
  }

  /**
   * Remove specific game state
   */
  static removeGameState(gameId: string): void {
    this.logger.trace('Attempting to remove game state', { gameId });

    if (typeof window === 'undefined' || !window.localStorage) {
      this.logger.debug('Local storage not available for game state removal');
      return;
    }

    try {
      const key = this.getKey(gameId);
      const existed = window.localStorage.getItem(key) !== null;

      window.localStorage.removeItem(key);

      if (existed) {
        this.logger.debug('Game state removed from storage', { gameId });
      } else {
        this.logger.debug('Game state did not exist in storage', { gameId });
      }
    } catch (error) {
      this.logger.error('Failed to remove game state', {
        gameId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if game state exists for a game ID
   */
  static hasGameState(gameId: string): boolean {
    this.logger.trace('Checking if game state exists', { gameId });

    if (typeof window === 'undefined' || !window.localStorage) {
      this.logger.debug('Local storage not available for game state check');
      return false;
    }

    try {
      const key = this.getKey(gameId);
      const data = window.localStorage.getItem(key);
      if (!data) {
        this.logger.debug('No game state found in storage', { gameId });
        return false;
      }

      const persistedState: PersistedGameState = JSON.parse(data);
      const timeSinceLastSave = Date.now() - persistedState.timestamp;
      const isValid = timeSinceLastSave <= this.TTL_MS;

      this.logger.debug('Game state existence check completed', {
        gameId,
        exists: true,
        isValid,
        ageMinutes: Math.round(timeSinceLastSave / (1000 * 60)),
      });

      return isValid;
    } catch (error) {
      this.logger.warn('Error checking game state existence', {
        gameId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Clean up old/expired game states
   */
  static cleanup(): void {
    this.logger.trace('Starting game state cleanup');

    if (typeof window === 'undefined' || !window.localStorage) {
      this.logger.debug('Local storage not available for cleanup');
      return;
    }

    try {
      const keysToRemove: string[] = [];
      let totalKeys = 0;
      let expiredKeys = 0;
      let corruptedKeys = 0;

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(this.KEY_PREFIX)) {
          totalKeys++;
          try {
            const data = window.localStorage.getItem(key);
            if (data) {
              const persistedState: PersistedGameState = JSON.parse(data);
              if (Date.now() - persistedState.timestamp > this.TTL_MS) {
                keysToRemove.push(key);
                expiredKeys++;
              }
            }
          } catch {
            // Remove corrupted entries
            keysToRemove.push(key);
            corruptedKeys++;
          }
        }
      }

      keysToRemove.forEach(key => {
        window.localStorage.removeItem(key);
      });

      this.logger.info('Game state cleanup completed', {
        totalGameStates: totalKeys,
        expiredRemoved: expiredKeys,
        corruptedRemoved: corruptedKeys,
        totalRemoved: keysToRemove.length,
        remaining: totalKeys - keysToRemove.length,
      });
    } catch (error) {
      this.logger.error('Failed to cleanup game states', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get all stored game IDs (for debugging)
   */
  static getStoredGameIds(): string[] {
    this.logger.trace('Retrieving all stored game IDs');

    if (typeof window === 'undefined' || !window.localStorage) {
      this.logger.debug('Local storage not available for game ID retrieval');
      return [];
    }

    const gameIds: string[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(this.KEY_PREFIX)) {
          const gameId = key.replace(this.KEY_PREFIX, '');
          gameIds.push(gameId);
        }
      }

      this.logger.debug('Retrieved stored game IDs', {
        count: gameIds.length,
        gameIds: gameIds.slice(0, 5), // Log first 5 for brevity
      });
    } catch (error) {
      this.logger.error('Failed to retrieve stored game IDs', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return gameIds;
  }

  private static getKey(gameId: string): string {
    return `${this.KEY_PREFIX}${gameId}`;
  }
}
