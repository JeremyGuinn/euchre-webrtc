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
  private logger = createScopedLogger('GameNetworkService');

  setStatusChangeHandler(handler: PeerStatusHandler) {
    this.logger.debug('Setting status change handler');
    this.networkManager.onStatusChange(status => {
      this.logger.debug('Network status changed', { status });
      handler(status);
    });
  }

  setConnectionChangeHandler(handler: PeerConnectionHandler) {
    this.logger.debug('Setting connection change handler');
    this.networkManager.onConnectionChange((peerId, connected) => {
      this.logger.debug('Peer connection changed', { peerId, connected });
      handler(peerId, connected);
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

  sendMessage(message: GameMessage, targetId?: string) {
    this.logger.debug('Sending message', {
      messageType: message.type,
      messageId: message.messageId,
      targetId,
      timestamp: message.timestamp,
    });
    this.networkManager.sendMessage(message, targetId);
  }

  registerMessageHandler(messageType: string, handler: PeerMessageHandler) {
    this.logger.debug('Registering message handler', { messageType });
    this.networkManager.onMessage(messageType, (message, senderId) => {
      this.logger.debug('Message received', {
        messageType,
        messageId: message.messageId,
        senderId,
        timestamp: message.timestamp,
      });
      handler(message, senderId);
    });
  }

  disconnect() {
    this.logger.info('Disconnecting from network');
    this.networkManager.disconnect();
    this.logger.debug('Network disconnection completed');
  }

  async leaveGame(
    reason: 'manual' | 'error' | 'network' | 'kicked' = 'manual'
  ): Promise<void> {
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
    onRetryAttempt?: (
      attempt: number,
      maxRetries: number,
      reason?: string
    ) => void
  ): Promise<{ hostId: string; gameCode: string }> {
    return this.logger.withPerformance('reconnectAsHost', async () => {
      this.logger.info('Starting host reconnection', { hostId, gameCode });

      let lastError: Error | null = null;
      let currentHostId = hostId;
      let currentGameCode = gameCode;

      for (
        let attempt = 0;
        attempt < RECONNECTION_CONFIG.MAX_RETRIES;
        attempt++
      ) {
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

            onRetryAttempt(
              attempt + 1,
              RECONNECTION_CONFIG.MAX_RETRIES,
              reason
            );
          }

          await this.networkManager.initialize(true, currentHostId);
          this.logger.debug(
            'Network manager initialized for host reconnection',
            { currentHostId }
          );

          // If we had to generate a new game code, update the session
          if (currentGameCode !== gameCode) {
            this.logger.info('Updating session with new game code', {
              oldGameCode: gameCode,
              newGameCode: currentGameCode,
              newHostId: currentHostId,
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
              this.logger.warn(
                'ID conflict detected, generating new game code',
                {
                  attempt: attempt + 1,
                  oldGameCode: currentGameCode,
                  oldHostId: currentHostId,
                }
              );

              const { generateGameCode, gameCodeToHostId } = await import(
                '~/utils/gameCode'
              );
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

  async reconnectAsClient(
    gameCode: string,
    playerId: string,
    playerName: string
  ): Promise<void> {
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
    onRetryAttempt?: (
      attempt: number,
      maxRetries: number,
      reason?: string
    ) => void
  ): Promise<void> {
    return this.logger.withPerformance('pollReconnectAsClient', async () => {
      this.logger.info('Starting polling client reconnection', {
        gameCode,
        playerId,
        playerName,
        maxAttempts: RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS,
      });

      let lastError: Error | null = null;

      for (
        let attempt = 0;
        attempt < RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS;
        attempt++
      ) {
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

            onRetryAttempt(
              attempt + 1,
              RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS,
              reason
            );
          }

          // Clean up any existing connection before attempting reconnection
          this.logger.debug('Cleaning up existing connections before retry');
          this.networkManager.disconnect();

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
              Math.pow(
                RECONNECTION_CONFIG.CLIENT_POLL_BACKOFF_MULTIPLIER,
                attempt
              );

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

  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }
}
