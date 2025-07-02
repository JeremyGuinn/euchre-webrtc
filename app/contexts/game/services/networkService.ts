import type { GameMessage } from "../../../types/messages";
import { NetworkManager } from "../../../utils/networking";
import { createMessageId } from "../../../utils/protocol";
import { generateGameCode, gameCodeToHostId } from "../../../utils/gameCode";

export class GameNetworkService {
  private networkManager: NetworkManager = new NetworkManager();
  private messageHandlers: Map<string, (message: GameMessage, senderId: string) => void> = new Map();

  setStatusChangeHandler(
    handler: (
      status: "disconnected" | "connecting" | "connected" | "error"
    ) => void
  ) {
    this.networkManager.onStatusChange(handler);
  }

  setConnectionChangeHandler(
    handler: (peerId: string, connected: boolean) => void
  ) {
    this.networkManager.onConnectionChange(handler);
  }

  async hostGame(): Promise<{ gameCode: string; hostId: string; gameUuid: string }> {
    const gameCode = generateGameCode();
    const hostId = gameCodeToHostId(gameCode);
    const gameUuid = crypto.randomUUID(); // Keep internal UUID for game state management

    await this.networkManager.initialize(true, hostId);

    return {
      gameCode,
      hostId,
      gameUuid,
    };
  }

  async joinGame(
    gameCode: string,
    playerName: string,
  ): Promise<string> {
    const hostId = gameCodeToHostId(gameCode);
    const playerId = await this.networkManager.initialize(false);

    await this.networkManager.connectToPeer(hostId);

    this.networkManager.sendMessage({
      type: "JOIN_REQUEST",
      timestamp: Date.now(),
      messageId: createMessageId(),
      payload: { playerName },
    }, hostId);

    return playerId;
  }

  sendMessage(message: GameMessage, targetId?: string) {
    this.networkManager.sendMessage(message, targetId);
  }

  registerMessageHandler(
    messageType: string,
    handler: (message: GameMessage, senderId: string) => void
  ) {
    this.messageHandlers.set(messageType, handler);
    this.networkManager.onMessage(messageType as any, handler);
  }

  unregisterMessageHandler(messageType: string) {
    this.messageHandlers.delete(messageType);
  }

  clearAllHandlers() {
    this.messageHandlers.clear();
  }

  disconnect() {
    if (this.networkManager) {
      this.clearAllHandlers();
      this.networkManager.disconnect();
      this.networkManager = new NetworkManager();
    }
  }

  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }
}
