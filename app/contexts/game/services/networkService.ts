import type { GameMessage } from '../../../types/messages';
import { gameCodeToHostId, generateGameCode } from '../../../utils/gameCode';
import {
  NetworkManager,
  type PeerConnectionHandler,
  type PeerMessageHandler,
  type PeerStatusHandler,
} from '../../../utils/networking';
import { createMessageId } from '../../../utils/protocol';

export class GameNetworkService {
  private networkManager: NetworkManager = new NetworkManager();
  private messageHandlers: Map<string, PeerMessageHandler> = new Map();

  setStatusChangeHandler(handler: PeerStatusHandler) {
    this.networkManager.onStatusChange(handler);
  }

  setConnectionChangeHandler(handler: PeerConnectionHandler) {
    this.networkManager.onConnectionChange(handler);
  }

  async hostGame(): Promise<{
    gameCode: string;
    hostId: string;
    gameUuid: string;
  }> {
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

  async joinGame(gameCode: string, playerName: string): Promise<string> {
    const hostId = gameCodeToHostId(gameCode);
    const playerId = await this.networkManager.initialize(false);

    await this.networkManager.connectToPeer(hostId);

    this.networkManager.sendMessage(
      {
        type: 'JOIN_REQUEST',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { playerName },
      },
      hostId
    );

    return playerId;
  }

  sendMessage(message: GameMessage, targetId?: string) {
    this.networkManager.sendMessage(message, targetId);
  }

  registerMessageHandler(messageType: string, handler: PeerMessageHandler) {
    this.networkManager.onMessage(messageType, handler);
  }

  disconnect() {
    this.networkManager.disconnect();
  }

  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }
}
