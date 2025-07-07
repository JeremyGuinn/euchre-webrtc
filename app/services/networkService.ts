import { createScopedLogger } from '~/services/loggingService';
import type { GameMessage } from '~/types/messages';
import { gameCodeToHostId, generateGameCode } from '~/utils/gameCode';
import {
  NetworkManager,
  type PeerConnectionHandler,
  type PeerMessageHandler,
  type PeerStatusHandler,
} from '~/utils/networking';
import { createMessageId } from '~/utils/protocol';
import {
  RECONNECTION_CONFIG,
  isPeerJSIdConflictError,
  sleep,
} from '~/utils/reconnection';

export class GameNetworkService {
  private networkManager: NetworkManager = new NetworkManager();
  private messageHandlers: Map<string, PeerMessageHandler> = new Map();
  private readonly logger = createScopedLogger('GameNetworkService');

  constructor() {
    this.logger.debug('GameNetworkService instance created');
  }

  setStatusChangeHandler(handler: PeerStatusHandler) {
    this.logger.debug('Registering status change handler');
    this.networkManager.onStatusChange(status => {
      this.logger.debug('Network status changed', { status });
      handler(status);
    });
  }

  setConnectionChangeHandler(handler: PeerConnectionHandler) {
    this.logger.debug('Registering connection change handler');
    this.networkManager.onConnectionChange((peerId, connected) => {
      if (connected) {
        this.logger.info('Peer connected', { peerId });
      } else {
        this.logger.info('Peer disconnected', { peerId });
      }
      handler(peerId, connected);
    });
  }

  async hostGame(): Promise<{
    gameCode: string;
    hostId: string;
    gameUuid: string;
  }> {
    this.logger.trace('Starting game host process');

    const gameCode = generateGameCode();
    const hostId = gameCodeToHostId(gameCode);
    const gameUuid = crypto.randomUUID(); // Keep internal UUID for game state management

    try {
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
    } catch (error) {
      this.logger.error('Failed to host game', {
        gameCode,
        hostId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async joinGame(gameCode: string, playerName: string): Promise<string> {
    this.logger.trace('Starting game join process', { gameCode, playerName });

    const hostId = gameCodeToHostId(gameCode);

    try {
      const playerId = await this.networkManager.initialize(false);
      this.logger.debug('Network initialized for client', { playerId });

      await this.networkManager.connectToPeer(hostId);
      this.logger.debug('Connected to host peer', { hostId });

      this.networkManager.sendMessage(
        {
          type: 'JOIN_REQUEST',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { playerName },
        },
        hostId
      );

      this.logger.info('Join request sent to host', {
        gameCode,
        playerName,
        playerId,
      });

      return playerId;
    } catch (error) {
      this.logger.error('Failed to join game', {
        gameCode,
        hostId,
        playerName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  sendMessage(message: GameMessage, targetId?: string) {
    this.logger.trace('Sending message', {
      messageType: message.type,
      targetId: targetId || 'broadcast',
    });

    try {
      this.networkManager.sendMessage(message, targetId);
      this.logger.debug('Message sent successfully', {
        messageType: message.type,
        messageId: message.messageId,
      });
    } catch (error) {
      this.logger.error('Failed to send message', {
        messageType: message.type,
        messageId: message.messageId,
        targetId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  registerMessageHandler(messageType: string, handler: PeerMessageHandler) {
    this.logger.debug('Registering message handler', { messageType });

    const wrappedHandler: PeerMessageHandler = (message, senderId) => {
      this.logger.trace('Processing received message', {
        messageType: message.type,
        senderId,
      });

      try {
        handler(message, senderId);
        this.logger.debug('Message processed successfully', {
          messageType: message.type,
          messageId: message.messageId,
        });
      } catch (error) {
        this.logger.error('Message handler failed', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    this.networkManager.onMessage(messageType, wrappedHandler);
  }

  disconnect() {
    this.logger.info('Disconnecting from network');
    this.networkManager.disconnect();
    this.logger.debug('Network disconnection completed');
  }

  async leaveGame(
    reason: 'manual' | 'error' | 'network' | 'kicked' = 'manual'
  ): Promise<void> {
    this.logger.info('Leaving game', { reason });

    try {
      if (reason !== 'kicked') {
        // Send leave message to host before disconnecting
        this.networkManager.sendMessage({
          type: 'LEAVE_GAME',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { reason },
        });

        // Give a brief moment for the message to be sent before disconnecting
        await sleep(100);
      }

      // Now disconnect
      this.disconnect();

      this.logger.debug('Game leave process completed');
    } catch (error) {
      this.logger.warn('Error during game leave process', {
        reason,
        error: error instanceof Error ? error.message : String(error),
      });
      // Still disconnect even if there was an error
      this.disconnect();
    }
  }

  async reconnectAsHost(
    hostId: string,
    gameCode: string,
    onRetryAttempt?: (
      attempt: number,
      maxRetries: number,
      reason?: string
    ) => void
  ): Promise<{ hostId: string; gameCode: string }> {
    this.logger.info('Starting host reconnection process', {
      hostId,
      gameCode,
    });

    let lastError: Error | null = null;
    let currentHostId = hostId;
    let currentGameCode = gameCode;

    for (
      let attempt = 0;
      attempt < RECONNECTION_CONFIG.MAX_RETRIES;
      attempt++
    ) {
      this.logger.trace('Host reconnection attempt', {
        attempt: attempt + 1,
        maxRetries: RECONNECTION_CONFIG.MAX_RETRIES,
        currentHostId,
        currentGameCode,
      });

      try {
        // Notify about retry attempt if this isn't the first attempt
        if (attempt > 0 && onRetryAttempt) {
          const reason = isPeerJSIdConflictError(lastError!)
            ? 'Game ID conflict detected'
            : 'Connection failed';
          this.logger.debug('Notifying UI of retry attempt', {
            attempt: attempt + 1,
            reason,
          });
          onRetryAttempt(attempt + 1, RECONNECTION_CONFIG.MAX_RETRIES, reason);
        }

        await this.networkManager.initialize(true, currentHostId);

        // If we had to generate a new game code, update the session
        if (currentGameCode !== gameCode) {
          this.logger.info('Game code changed during reconnection', {
            originalGameCode: gameCode,
            newGameCode: currentGameCode,
          });

          const { SessionStorageService } = await import(
            '~/services/sessionService'
          );
          const session = SessionStorageService.getSession();
          if (session) {
            SessionStorageService.saveSession({
              ...session,
              gameCode: currentGameCode,
              playerId: currentHostId,
            });
          }
        }

        this.logger.info('Host reconnection successful', {
          hostId: currentHostId,
          gameCode: currentGameCode,
          attempts: attempt + 1,
        });

        return { hostId: currentHostId, gameCode: currentGameCode }; // Success!
      } catch (error) {
        lastError = error as Error;

        this.logger.warn('Host reconnection attempt failed', {
          attempt: attempt + 1,
          error: lastError.message,
          isIdConflict: isPeerJSIdConflictError(lastError),
        });

        // Check if this looks like an ID conflict error using the helper function
        const isIdConflict = isPeerJSIdConflictError(lastError);

        // If this isn't the last attempt, prepare for retry
        if (attempt < RECONNECTION_CONFIG.MAX_RETRIES - 1) {
          // For ID conflicts, generate a new game code after the first few attempts
          if (isIdConflict && attempt >= 1) {
            this.logger.debug('Generating new game code due to ID conflict');
            const { generateGameCode, gameCodeToHostId } = await import(
              '~/utils/gameCode'
            );
            currentGameCode = generateGameCode();
            currentHostId = gameCodeToHostId(currentGameCode);

            // Clean up the old network manager before trying with the new ID
            this.networkManager.disconnect();
          }

          const delay =
            RECONNECTION_CONFIG.INITIAL_RETRY_DELAY_MS *
            Math.pow(RECONNECTION_CONFIG.RETRY_BACKOFF_MULTIPLIER, attempt);

          this.logger.debug('Waiting before next reconnection attempt', {
            delayMs: delay,
          });
          await sleep(delay);
        }
      }
    }

    // If we get here, all attempts failed
    const errorMessage = `Host reconnection failed after ${RECONNECTION_CONFIG.MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'}`;
    this.logger.error('Host reconnection failed completely', {
      maxRetries: RECONNECTION_CONFIG.MAX_RETRIES,
      lastError: lastError?.message,
    });

    throw new Error(errorMessage);
  }

  async reconnectAsClient(
    gameCode: string,
    playerId: string,
    playerName: string
  ): Promise<void> {
    const hostId = gameCodeToHostId(gameCode);

    // For client reconnection, we don't use the old player ID as the peer ID
    // because PeerJS generates new IDs. Instead, we use the stored player ID
    // in the message payload to identify ourselves to the host.
    await this.networkManager.initialize(false);

    // Connect to the host
    await this.networkManager.connectToPeer(hostId);

    // Send a reconnection request with our original player ID
    this.networkManager.sendMessage(
      {
        type: 'RECONNECT_REQUEST',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          playerName,
          playerId, // This is our original game player ID, not the new peer ID
        },
      },
      hostId
    );
  }

  async pollReconnectAsClient(
    gameCode: string,
    playerId: string,
    playerName: string,
    onRetryAttempt?: (
      attempt: number,
      maxRetries: number,
      reason?: string
    ) => void
  ): Promise<void> {
    let lastError: Error | null = null;

    for (
      let attempt = 0;
      attempt < RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS;
      attempt++
    ) {
      try {
        // Notify about retry attempt if this isn't the first attempt
        if (attempt > 0 && onRetryAttempt) {
          const reason = 'Host disconnected, attempting to reconnect';
          onRetryAttempt(
            attempt + 1,
            RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS,
            reason
          );
        }

        // Clean up any existing connection before attempting reconnection
        this.networkManager.disconnect();

        // Attempt to reconnect
        await this.reconnectAsClient(gameCode, playerId, playerName);

        return; // Success!
      } catch (error) {
        lastError = error as Error;

        // If this isn't the last attempt, wait before retrying
        if (attempt < RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS - 1) {
          const delay =
            RECONNECTION_CONFIG.CLIENT_POLL_INTERVAL_MS *
            Math.pow(
              RECONNECTION_CONFIG.CLIENT_POLL_BACKOFF_MULTIPLIER,
              attempt
            );
          await sleep(delay);
        }
      }
    }

    // If we get here, all attempts failed
    throw new Error(
      `Client reconnection failed after ${RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }
}
