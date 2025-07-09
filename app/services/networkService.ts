import type { SessionData } from '~/contexts/SessionContext';
import { createMessageHandlers } from '~/network/handlers';
import { NetworkManager, type ConnectionStatus } from '~/network/networkManager';
import { createMessageId } from '~/network/protocol';
import { RECONNECTION_CONFIG, isPeerJSIdConflictError } from '~/network/reconnection';
import { createScopedLogger } from '~/services/loggingService';
import type { GameStore } from '~/store/gameStore';
import type { GameState } from '~/types/game';
import type { HandlerContext } from '~/types/handlers';
import type { GameMessage } from '~/types/messages';
import { sleep } from '~/utils/async';
import { gameCodeToHostId, generateGameCode } from '~/utils/game/gameCode';

// Cooldown period to prevent rapid reconnection attempts (5 seconds)
const RECONNECTION_COOLDOWN_MS = 5000;

export interface GameNetworkServiceConfig {
  gameState: GameState;
  gameStore: GameStore;
  myPlayerId: string;
  isHost: boolean;
  broadcastGameState: () => void;
  handleKicked: (message: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setMyPlayerId: (id: string) => void;
  setIsHost: (isHost: boolean) => void;
  pollForHostReconnection?: () => Promise<boolean>;
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

  // Track last reconnection attempt to prevent rapid-fire attempts
  private lastReconnectionAttempt = 0;
  // Track if a reconnection is currently in progress
  private isReconnecting = false;

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

  async reconnectAsHost(
    hostId: string,
    gameCode: string,
    onRetryAttempt?: (attempt: number, maxRetries: number, reason?: string) => void
  ): Promise<{ hostId: string; gameCode: string }> {
    return this.logger.withPerformance('reconnectAsHost', async () => {
      this.logger.info('Starting host reconnection', { hostId, gameCode });

      let lastError: Error | null = null;
      let currentHostId = hostId;
      let currentGameCode = gameCode;

      for (let attempt = 0; attempt < RECONNECTION_CONFIG.MAX_RETRIES; attempt++) {
        try {
          this.logger.debug('Host reconnection attempt', {
            attempt: attempt + 1,
            maxRetries: RECONNECTION_CONFIG.MAX_RETRIES,
            currentHostId,
            currentGameCode,
          });

          // Notify about retry attempt if this isn't the first attempt
          if (attempt > 0 && onRetryAttempt) {
            const reason = isPeerJSIdConflictError(lastError!)
              ? 'Game ID conflict detected'
              : 'Connection failed';

            this.logger.warn('Host reconnection retry', {
              attempt: attempt + 1,
              reason,
              lastError: lastError?.message,
            });

            onRetryAttempt(attempt + 1, RECONNECTION_CONFIG.MAX_RETRIES, reason);
          }

          await this.networkManager.initialize(true, currentHostId);
          this.logger.debug('Network manager initialized for host reconnection', { currentHostId });

          // If we had to generate a new game code, update the session
          if (currentGameCode !== gameCode) {
            this.logger.info('Updating session with new game code', {
              oldGameCode: gameCode,
              newGameCode: currentGameCode,
              newHostId: currentHostId,
            });

            const session = this.config?.sessionManager?.sessionData;
            if (session && this.config?.sessionManager) {
              this.config.sessionManager.saveSession({
                ...session,
                gameCode: currentGameCode,
                playerId: currentHostId,
              });
            }
          }

          this.logger.info('Host reconnection successful', {
            hostId: currentHostId,
            gameCode: currentGameCode,
            attemptsUsed: attempt + 1,
          });

          return { hostId: currentHostId, gameCode: currentGameCode }; // Success!
        } catch (error) {
          lastError = error as Error;
          this.logger.error('Host reconnection attempt failed', {
            attempt: attempt + 1,
            error: lastError.message,
            currentHostId,
            currentGameCode,
          });

          // Check if this looks like an ID conflict error using the helper function
          const isIdConflict = isPeerJSIdConflictError(lastError);

          // If this isn't the last attempt, prepare for retry
          if (attempt < RECONNECTION_CONFIG.MAX_RETRIES - 1) {
            // For ID conflicts, generate a new game code after the first few attempts
            if (isIdConflict && attempt >= 1) {
              this.logger.warn('ID conflict detected, generating new game code', {
                attempt: attempt + 1,
                oldGameCode: currentGameCode,
                oldHostId: currentHostId,
              });

              const { generateGameCode, gameCodeToHostId } = await import('~/utils/game/gameCode');
              currentGameCode = generateGameCode();
              currentHostId = gameCodeToHostId(currentGameCode);

              this.logger.debug('Generated new game identifiers', {
                newGameCode: currentGameCode,
                newHostId: currentHostId,
              });

              // Clean up the old network manager before trying with the new ID
              this.networkManager.disconnect();
            }

            const delay =
              RECONNECTION_CONFIG.INITIAL_RETRY_DELAY_MS *
              Math.pow(RECONNECTION_CONFIG.RETRY_BACKOFF_MULTIPLIER, attempt);

            this.logger.debug('Waiting before retry', {
              delay,
              attempt: attempt + 1,
            });
            await sleep(delay);
          }
        }
      }

      // If we get here, all attempts failed
      const errorMessage = `Host reconnection failed after ${RECONNECTION_CONFIG.MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'}`;
      this.logger.error('Host reconnection failed permanently', {
        maxRetries: RECONNECTION_CONFIG.MAX_RETRIES,
        lastError: lastError?.message,
        originalHostId: hostId,
        originalGameCode: gameCode,
      });

      throw new Error(errorMessage);
    });
  }

  async reconnectAsClient(gameCode: string, playerId: string, playerName: string): Promise<void> {
    return this.logger.withPerformance('reconnectAsClient', async () => {
      this.logger.info('Starting client reconnection', {
        gameCode,
        playerId,
        playerName,
      });

      const hostId = gameCodeToHostId(gameCode);
      this.logger.debug('Resolved host ID for client reconnection', { hostId });

      // For client reconnection, we don't use the old player ID as the peer ID
      // because PeerJS generates new IDs. Instead, we use the stored player ID
      // in the message payload to identify ourselves to the host.
      const newPeerId = await this.networkManager.initialize(false);
      this.logger.debug('Network manager initialized for client reconnection', {
        newPeerId,
      });

      // Connect to the host
      await this.networkManager.connectToPeer(hostId);
      this.logger.debug('Connected to host for client reconnection', {
        hostId,
      });

      // Send a reconnection request with our original player ID
      const reconnectMessage = {
        type: 'RECONNECT_REQUEST',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          playerName,
          playerId, // This is our original game player ID, not the new peer ID
        },
      } as GameMessage;

      this.logger.debug('Sending reconnection request', {
        message: reconnectMessage,
      });
      this.networkManager.sendMessage(reconnectMessage, hostId);

      this.logger.info('Client reconnection request sent successfully', {
        gameCode,
        playerId,
        playerName,
        newPeerId,
      });
    });
  }

  async pollReconnectAsClient(
    gameCode: string,
    playerId: string,
    playerName: string,
    onRetryAttempt?: (attempt: number, maxRetries: number, reason?: string) => void
  ): Promise<void> {
    return this.logger.withPerformance('pollReconnectAsClient', async () => {
      this.logger.info('Starting polling client reconnection', {
        gameCode,
        playerId,
        playerName,
        maxAttempts: RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS,
      });

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS; attempt++) {
        try {
          this.logger.debug('Client reconnection poll attempt', {
            attempt: attempt + 1,
            maxAttempts: RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS,
            gameCode,
            playerId,
          });

          // Notify about retry attempt if this isn't the first attempt
          if (attempt > 0 && onRetryAttempt) {
            const reason = 'Host disconnected, attempting to reconnect';

            this.logger.warn('Client reconnection poll retry', {
              attempt: attempt + 1,
              reason,
              lastError: lastError?.message,
            });

            onRetryAttempt(attempt + 1, RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS, reason);
          }

          // if we are connected, disconnect first
          if (this.networkManager.isConnected()) {
            this.logger.debug('Cleaning up existing connections before retry');
            this.networkManager.disconnect();
          }

          // Attempt to reconnect
          await this.reconnectAsClient(gameCode, playerId, playerName);

          this.logger.info('Client reconnection poll successful', {
            gameCode,
            playerId,
            playerName,
            attemptsUsed: attempt + 1,
          });

          return; // Success!
        } catch (error) {
          lastError = error as Error;
          this.logger.error('Client reconnection poll attempt failed', {
            attempt: attempt + 1,
            error: lastError.message,
            gameCode,
            playerId,
          });

          // If this isn't the last attempt, wait before retrying
          if (attempt < RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS - 1) {
            const delay =
              RECONNECTION_CONFIG.CLIENT_POLL_INTERVAL_MS *
              Math.pow(RECONNECTION_CONFIG.CLIENT_POLL_BACKOFF_MULTIPLIER, attempt);

            this.logger.debug('Waiting before client reconnection retry', {
              delay,
              attempt: attempt + 1,
            });

            await sleep(delay);
          }
        }
      }

      // If we get here, all attempts failed
      const errorMessage = `Client reconnection failed after ${RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS} attempts. Last error: ${lastError?.message || 'Unknown error'}`;

      this.logger.error('Client reconnection poll failed permanently', {
        maxAttempts: RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS,
        lastError: lastError?.message,
        gameCode,
        playerId,
        playerName,
      });

      throw new Error(errorMessage);
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

  /**
   * Configure the network service with game state and handlers
   */
  configure(config: GameNetworkServiceConfig) {
    this.logger.debug('Configuring network service', {
      myPlayerId: config.myPlayerId,
      isHost: config.isHost,
      gamePhase: config.gameState.phase,
      playerCount: config.gameState.players.length,
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
      myPlayerId: this.config.myPlayerId,
      isHost: this.config.isHost,
      gamePhase: this.config.gameState.phase,
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
      gamePhase: this.config.gameState.phase,
      myPlayerId: this.config.myPlayerId,
      isHost: this.config.isHost,
    });

    const context: HandlerContext = {
      myPlayerId: this.config.myPlayerId,
      isHost: this.config.isHost,
      gameStore: this.config.gameStore,
      networkManager: this.networkManager,
      broadcastGameState: this.config.broadcastGameState,
      handleKicked: this.config.handleKicked,
      setConnectionStatus: this.config.setConnectionStatus,
      setMyPlayerId: this.config.setMyPlayerId,
      setIsHost: this.config.setIsHost,
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
      isHost: this.config.isHost,
      gamePhase: this.config.gameState.phase,
    });

    this.config.gameStore.updatePlayerConnection(peerId, connected);

    // Handle host disconnection for clients
    if (!this.config.isHost && !connected && this.config.pollForHostReconnection) {
      this.handleHostDisconnection(peerId);
    }
  }

  /**
   * Handle host disconnection and attempt reconnection
   */
  private handleHostDisconnection(peerId: string) {
    if (!this.config) return;

    const hostPlayer = this.config.gameState.players.find(p => p.isHost);
    if (hostPlayer && hostPlayer.id === peerId) {
      this.logger.warn('Host disconnected, evaluating reconnection', {
        hostPlayerId: peerId,
        isReconnecting: this.isReconnecting,
      });

      // Check if a reconnection is already in progress
      if (this.isReconnecting) {
        this.logger.debug('Reconnection already in progress, skipping');
        return;
      }

      // Check cooldown to prevent rapid fire reconnection attempts
      const now = Date.now();
      const timeSinceLastAttempt = now - this.lastReconnectionAttempt;
      if (timeSinceLastAttempt < RECONNECTION_COOLDOWN_MS) {
        this.logger.debug('Reconnection cooldown active, skipping', {
          timeSinceLastAttempt,
          cooldownMs: RECONNECTION_COOLDOWN_MS,
        });
        return;
      }

      this.lastReconnectionAttempt = now;
      this.isReconnecting = true;

      // Only attempt reconnection if we're in a valid game phase
      const validReconnectionPhases = [
        'lobby',
        'dealer_selection',
        'team_summary',
        'dealing_animation',
        'farmers_hand_check',
        'farmers_hand_swap',
        'bidding_round1',
        'bidding_round2',
        'dealer_discard',
        'playing',
        'trick_complete',
        'hand_complete',
      ];

      if (validReconnectionPhases.includes(this.config.gameState.phase)) {
        this.logger.info('Starting host reconnection polling', {
          gamePhase: this.config.gameState.phase,
          hostPlayerId: peerId,
        });

        this.config.setConnectionStatus('reconnecting');

        this.config.pollForHostReconnection!()
          .then(success => {
            if (success) {
              this.logger.info('Host reconnection polling successful');
            } else {
              this.logger.warn('Host reconnection polling failed');
            }
          })
          .catch(error => {
            this.logger.error('Host reconnection polling error', {
              error: error instanceof Error ? error.message : String(error),
            });
            this.config?.setConnectionStatus('error');
          })
          .finally(() => {
            this.logger.debug('Host reconnection polling completed');
            this.isReconnecting = false;
          });
      } else {
        this.logger.warn('Cannot reconnect in current game phase', {
          gamePhase: this.config.gameState.phase,
          validPhases: validReconnectionPhases,
        });
        this.config.setConnectionStatus('disconnected');
        this.isReconnecting = false;
      }
    }
  }

  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }
}
