import { uuidToGameCode } from "../../../utils/gameCode";

export class SessionStorageService {
  private static readonly KEYS = {
    PLAYER_ID: "euchre-player-id",
    GAME_ID: "euchre-game-id",
  } as const;

  static saveSession(playerId: string, gameId: string) {
    // sessionStorage.setItem(this.KEYS.PLAYER_ID, playerId);
    // sessionStorage.setItem(this.KEYS.GAME_ID, uuidToGameCode(gameId));
  }

  static getSession() {
    return {
      playerId: sessionStorage.getItem(this.KEYS.PLAYER_ID),
      gameId: sessionStorage.getItem(this.KEYS.GAME_ID),
    };
  }

  static clearSession() {
    sessionStorage.removeItem(this.KEYS.PLAYER_ID);
    sessionStorage.removeItem(this.KEYS.GAME_ID);
  }

  static hasValidSession(): boolean {
    const { playerId, gameId } = this.getSession();
    return !!(playerId && gameId);
  }
}
