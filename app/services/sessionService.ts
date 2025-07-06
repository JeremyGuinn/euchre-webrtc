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

  static savePlayerName(playerName: string) {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    window.sessionStorage.setItem(this.KEYS.PLAYER_NAME, playerName);
  }

  static getPlayerName() {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;

    return window.sessionStorage.getItem(this.KEYS.PLAYER_NAME);
  }

  static saveSession(data: Omit<SessionData, 'lastConnectionTime'>) {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    const sessionData: SessionData = {
      ...data,
      lastConnectionTime: Date.now(),
    };

    window.sessionStorage.setItem(
      this.KEYS.SESSION_DATA,
      JSON.stringify(sessionData)
    );
  }

  static getSession(): SessionData | null {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;

    try {
      const data = window.sessionStorage.getItem(this.KEYS.SESSION_DATA);
      if (!data) return null;

      const sessionData: SessionData = JSON.parse(data);

      // Check if session has expired
      const now = Date.now();
      if (now - sessionData.lastConnectionTime > this.SESSION_TIMEOUT_MS) {
        this.clearSession();
        return null;
      }

      return sessionData;
    } catch {
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
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    window.sessionStorage.removeItem(this.KEYS.SESSION_DATA);
  }

  static hasValidSession(): boolean {
    const session = this.getSession();
    return !!(session?.playerId && session?.gameId);
  }
}
