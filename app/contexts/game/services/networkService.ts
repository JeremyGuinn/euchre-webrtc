import { v4 as uuidv4 } from "uuid";
import type { GameMessage, JoinRequestMessage } from "../../../types/messages";
import { NetworkManager } from "../../../utils/networking";
import { createMessageId } from "../../../utils/protocol";
import { uuidToGameCode, gameCodeToUuid } from "../../../utils/gameCode";

export class GameNetworkService {
  private networkManager: NetworkManager | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.networkManager = new NetworkManager();
  }

  setStatusChangeHandler(
    handler: (
      status: "disconnected" | "connecting" | "connected" | "error"
    ) => void
  ) {
    if (this.networkManager) {
      this.networkManager.onStatusChange(handler);
    }
  }

  setConnectionChangeHandler(
    handler: (peerId: string, connected: boolean) => void
  ) {
    if (this.networkManager) {
      this.networkManager.onConnectionChange(handler);
    }
  }

  async hostGame(): Promise<{ gameCode: string; hostId: string; gameUuid: string }> {
    if (!this.networkManager) {
      throw new Error("Network manager not initialized");
    }

    const gameUuid = uuidv4();
    const hostId = await this.networkManager.initialize(true, gameUuid);

    return {
      gameCode: uuidToGameCode(gameUuid),
      hostId,
      gameUuid,
    };
  }

  async joinGame(
    gameCode: string,
    playerName: string,
  ): Promise<string> {
    if (!this.networkManager) {
      throw new Error("Network manager not initialized");
    }

    const gameUuid = gameCodeToUuid(gameCode);
    const playerId = await this.networkManager.initialize(false);

    await this.networkManager.connectToPeer(gameUuid);

    this.networkManager.sendMessage({
      type: "JOIN_REQUEST",
      timestamp: Date.now(),
      messageId: createMessageId(),
      payload: { playerName },
    }, gameUuid);

    return playerId;
  }

  sendMessage(message: GameMessage, targetId?: string) {
    if (this.networkManager) {
      this.networkManager.sendMessage(message, targetId);
    }
  }

  registerMessageHandler(
    messageType: string,
    handler: (message: GameMessage, senderId: string) => void
  ) {
    if (this.networkManager) {
      this.networkManager.onMessage(messageType as any, handler);
    }
  }

  disconnect() {
    if (this.networkManager) {
      this.networkManager.disconnect();
    }
  }

  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }
}
