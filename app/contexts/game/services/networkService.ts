import { v4 as uuidv4 } from "uuid";
import type { GameMessage, JoinRequestMessage } from "../../../types/messages";
import { NetworkManager } from "../../../utils/networking";
import { createMessageId } from "../../../utils/protocol";
import { uuidToGameCode, gameCodeToUuid } from "../../../utils/gameCode";

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
    this.networkManager.sendMessage(message, targetId);
  }

  registerMessageHandler(
    messageType: string,
    handler: (message: GameMessage, senderId: string) => void
  ) {
    // Store handler for potential cleanup
    this.messageHandlers.set(messageType, handler);
    this.networkManager.onMessage(messageType as any, handler);
  }

  unregisterMessageHandler(messageType: string) {
    this.messageHandlers.delete(messageType);
    // Note: NetworkManager should ideally provide an unregister method
  }

  clearAllHandlers() {
    this.messageHandlers.clear();
    // Clear all handlers when service is reset
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
