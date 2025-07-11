import type { SessionData } from '~/contexts/SessionContext';
import { createMessageHandlers } from '~/network/handlers';
import { NetworkManager, type ConnectionStatus } from '~/network/networkManager';
import { createMessageId } from '~/network/protocol';
import { createScopedLogger } from '~/services/loggingService';
import type { GameStore } from '~/store/gameStore';
import type { HandlerContext } from '~/types/handlers';
import type { GameMessage } from '~/types/messages';
import { sleep } from '~/utils/async';
import { gameCodeToHostId, generateGameCode } from '~/utils/game/gameCode';

export interface GameNetworkServiceConfig {
  gameStore: GameStore;
  handleKicked: (message: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  sessionManager?: {
    saveSession: (data: Omit<SessionData, 'lastConnectionTime'>) => void;
    updateSession: (updates: Partial<Omit<SessionData, 'lastConnectionTime'>>) => void;
    clearSession: () => void;
    sessionData: SessionData | null;
  };
}

export class GameNetworkService {
  private networkManager: NetworkManager = new NetworkManager();
  private logger = createScopedLogger('GameNetworkService');
  private config: GameNetworkServiceConfig | null = null;
  private messageHandlersRegistered = false;

  sendMessage(message: GameMessage, targetId?: string) {
    this.logger.debug('Sending message', {
      messageType: message.type,
      messageId: message.messageId,
      targetId,
      timestamp: message.timestamp,
    });
    this.networkManager.sendMessage(message, targetId);
  }

  disconnect() {
    this.logger.info('Disconnecting from network');
    this.networkManager.disconnect();
    this.logger.debug('Network disconnection completed');
  }

  async leaveGame(reason: 'manual' | 'error' | 'network' | 'kicked' = 'manual'): Promise<void> {
    return this.logger.withOperation('leaveGame', async () => {
      this.logger.info('Leaving game', { reason });

      try {
        if (reason !== 'kicked') {
          this.logger.debug('Sending leave game message to host', { reason });

          // Send leave message to host before disconnecting
          this.networkManager.sendMessage({
            type: 'LEAVE_GAME',
            timestamp: Date.now(),
            messageId: createMessageId(),
            payload: { reason },
          } as GameMessage);

          // Give a brief moment for the message to be sent before disconnecting
          await sleep(100);
          this.logger.debug('Leave message sent, waiting before disconnect');
        } else {
          this.logger.debug('Skipping leave message (kicked from game)');
        }
      } catch (error) {
        this.logger.error('Error sending leave game message', {
          error: error instanceof Error ? error.message : String(error),
          reason,
        });
      } finally {
        this.disconnect();
        this.logger.info('Game left successfully', { reason });
      }
    });
  }

  async hostGame(): Promise<{
    gameCode: string;
    hostId: string;
    gameUuid: string;
  }> {
    return this.logger.withPerformance('hostGame', async () => {
      this.logger.info('Starting to host game');

      const gameCode = generateGameCode();
      const hostId = gameCodeToHostId(gameCode);
      const gameUuid = crypto.randomUUID(); // Keep internal UUID for game state management

      this.logger.debug('Generated game identifiers', {
        gameCode,
        hostId,
        gameUuid,
      });

      await this.networkManager.initialize(true, hostId);

      this.logger.info('Game hosted successfully', {
        gameCode,
        hostId,
        gameUuid,
      });

      return {
        gameCode,
        hostId,
        gameUuid,
      };
    });
  }

  async joinGame(gameCode: string, playerName: string): Promise<string> {
    return this.logger.withPerformance('joinGame', async () => {
      this.logger.info('Attempting to join game', { gameCode, playerName });

      const hostId = gameCodeToHostId(gameCode);
      this.logger.debug('Resolved host ID from game code', {
        gameCode,
        hostId,
      });

      const playerId = await this.networkManager.initialize(false);
      this.logger.debug('Network manager initialized', { playerId });

      await this.networkManager.connectToPeer(hostId);
      this.logger.debug('Connected to host peer', { hostId });

      const joinMessage = {
        type: 'JOIN_REQUEST',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { playerName },
      } as GameMessage;

      this.logger.debug('Sending join request', { message: joinMessage });
      this.networkManager.sendMessage(joinMessage, hostId);

      this.logger.info('Join game request sent successfully', {
        gameCode,
        playerName,
        playerId,
      });
      return playerId;
    });
  }

  get isHost(): boolean {
    if (!this.config) {
      this.logger.warn('Cannot determine host status before configuration');
      return false;
    }
    const myPlayer = this.config.gameStore.players.find(
      p => p.id === this.config!.gameStore.myPlayerId
    );

    return myPlayer?.isHost ?? false;
  }

  /**
   * Configure the network service with game state and handlers
   */
  configure(config: GameNetworkServiceConfig) {
    this.logger.debug('Configuring network service', {
      isHost: this.isHost,
      gamePhase: config.gameStore.phase,
      playerCount: config.gameStore.players.length,
    });

    this.config = config;

    // Only set up handlers once
    if (!this.messageHandlersRegistered) {
      this.setupNetworkHandlers();
      this.setupMessageHandlers();
    }
  }

  /**
   * Update the configuration with new values
   */
  updateConfig(updates: Partial<GameNetworkServiceConfig>) {
    if (!this.config) {
      this.logger.warn('Cannot update config before initial configuration');
      return;
    }

    this.config = { ...this.config, ...updates };
    this.logger.debug('Network service configuration updated', {
      myPlayerId: this.config.gameStore.myPlayerId,
      isHost: this.isHost,
      gamePhase: this.config.gameStore.phase,
    });
  }

  /**
   * Set up network event handlers for status and connection changes
   */
  private setupNetworkHandlers() {
    if (!this.config) return;

    this.logger.debug('Setting up network event handlers');

    this.networkManager.onStatusChange(status => {
      this.logger.info('Network status changed', { status });
      this.config?.setConnectionStatus(status);
    });

    this.networkManager.onConnectionChange((peerId, connected) => {
      this.handleConnectionChange(peerId, connected);
    });

    this.logger.debug('Network event handlers setup complete');
  }

  /**
   * Set up message handlers
   */
  private setupMessageHandlers() {
    if (!this.config || this.messageHandlersRegistered) return;

    this.logger.debug('Setting up message handlers');
    const messageHandlers = createMessageHandlers();
    const handlerCount = Object.keys(messageHandlers).length;

    this.logger.info('Setting up message handlers', { handlerCount });

    Object.entries(messageHandlers).forEach(([messageType, handler]) => {
      this.logger.debug('Registering message handler', { messageType });
      this.networkManager.onMessage(messageType, (message, senderId) => {
        this.handleMessageWithContext(message, senderId, handler);
      });
    });

    this.messageHandlersRegistered = true;
    this.logger.info('Message handlers registration complete', {
      handlerCount,
      messageTypes: Object.keys(messageHandlers),
    });
  }

  /**
   * Handle incoming messages with proper context
   */
  private handleMessageWithContext(
    message: GameMessage,
    senderId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: any
  ) {
    if (!this.config) {
      this.logger.error('Cannot handle message without configuration', {
        messageType: message.type,
        messageId: message.messageId,
        senderId,
      });
      return;
    }

    this.logger.debug('Processing message with context', {
      messageType: message.type,
      messageId: message.messageId,
      senderId,
      gamePhase: this.config.gameStore.phase,
      myPlayerId: this.config.gameStore.myPlayerId,
      isHost: this.isHost,
    });

    const context: HandlerContext = {
      myPlayerId: this.config.gameStore.myPlayerId,
      isHost: this.isHost,
      gameStore: this.config.gameStore,
      networkManager: this.networkManager,
      handleKicked: this.config.handleKicked,
      setConnectionStatus: this.config.setConnectionStatus,
      sessionManager: this.config.sessionManager || {
        saveSession: () => console.warn('SessionManager not available in handler context'),
        updateSession: () => console.warn('SessionManager not available in handler context'),
        clearSession: () => console.warn('SessionManager not available in handler context'),
        sessionData: null,
      },
    };

    try {
      handler(message, senderId, context);
      this.logger.debug('Message handled successfully', {
        messageType: message.type,
        messageId: message.messageId,
        senderId,
      });
    } catch (error) {
      this.logger.error('Error handling message', {
        messageType: message.type,
        messageId: message.messageId,
        senderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle connection changes
   */
  private handleConnectionChange(peerId: string, connected: boolean) {
    if (!this.config) return;

    this.logger.info('Peer connection changed', {
      peerId,
      connected,
      isHost: this.isHost,
      gamePhase: this.config.gameStore.phase,
    });

    this.config.gameStore.updatePlayerConnection(peerId, connected);
  }

  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }
}
