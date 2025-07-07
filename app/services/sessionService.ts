import { createScopedLogger } from './loggingService';

interface SessionData {
  playerId: string;
  gameId: string;
  gameCode?: string;
  isHost: boolean;
  playerName?: string;
  lastConnectionTime: number;
}

export class SessionStorageService {
  private static readonly KEYS = {
    SESSION_DATA: 'euchre-session-data',
    PLAYER_NAME: 'euchre-player-name',
  } as const;

  // Session expires after 1 hour of inactivity
  private static readonly SESSION_TIMEOUT_MS = 60 * 60 * 1000;

  private static logger = createScopedLogger('SessionStorageService');

  static savePlayerName(playerName: string) {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      this.logger.debug('Session storage not available for player name save');
      return;
    }

    this.logger.debug('Saving player name to session storage', { playerName });
    window.sessionStorage.setItem(this.KEYS.PLAYER_NAME, playerName);
  }

  static getPlayerName() {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      this.logger.debug(
        'Session storage not available for player name retrieval'
      );
      return null;
    }

    const playerName = window.sessionStorage.getItem(this.KEYS.PLAYER_NAME);
    this.logger.debug('Retrieved player name from session storage', {
      found: !!playerName,
    });
    return playerName;
  }

  static saveSession(data: Omit<SessionData, 'lastConnectionTime'>) {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      this.logger.debug('Session storage not available for session save');
      return;
    }

    const sessionData: SessionData = {
      ...data,
      lastConnectionTime: Date.now(),
    };

    this.logger.info('Saving game session', {
      gameCode: data.gameCode,
      isHost: data.isHost,
      playerName: data.playerName,
    });

    window.sessionStorage.setItem(
      this.KEYS.SESSION_DATA,
      JSON.stringify(sessionData)
    );
  }

  static getSession(): SessionData | null {
    this.logger.trace('Attempting to retrieve session from storage');

    if (typeof window === 'undefined' || !window.sessionStorage) {
      this.logger.debug('Session storage not available');
      return null;
    }

    try {
      const data = window.sessionStorage.getItem(this.KEYS.SESSION_DATA);
      if (!data) {
        this.logger.debug('No session data found in storage');
        return null;
      }

      const sessionData: SessionData = JSON.parse(data);

      // Check if session has expired
      const now = Date.now();
      const timeSinceLastConnection = now - sessionData.lastConnectionTime;

      if (timeSinceLastConnection > this.SESSION_TIMEOUT_MS) {
        this.logger.info('Session expired, clearing storage', {
          timeSinceLastConnection: Math.round(
            timeSinceLastConnection / 1000 / 60
          ),
          timeoutMinutes: Math.round(this.SESSION_TIMEOUT_MS / 1000 / 60),
        });
        this.clearSession();
        return null;
      }

      this.logger.debug('Valid session retrieved from storage', {
        gameCode: sessionData.gameCode,
        isHost: sessionData.isHost,
        timeSinceLastConnection: Math.round(timeSinceLastConnection / 1000),
      });

      return sessionData;
    } catch (error) {
      this.logger.error('Failed to parse session data, clearing storage', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.clearSession();
      return null;
    }
  }

  static updateLastConnectionTime() {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    const sessionData = this.getSession();
    if (sessionData) {
      sessionData.lastConnectionTime = Date.now();
      window.sessionStorage.setItem(
        this.KEYS.SESSION_DATA,
        JSON.stringify(sessionData)
      );
    }
  }

  static clearSession() {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      this.logger.debug('Session storage not available for clearing');
      return;
    }

    this.logger.info('Clearing game session from storage');
    window.sessionStorage.removeItem(this.KEYS.SESSION_DATA);
  }

  static hasValidSession(): boolean {
    this.logger.trace('Checking for valid session');

    const session = this.getSession();
    const isValid = !!(session?.playerId && session?.gameId);

    this.logger.debug('Session validity check completed', {
      hasSession: !!session,
      isValid,
    });

    return isValid;
  }
}
