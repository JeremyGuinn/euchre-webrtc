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

  async reconnectAsHost(
    hostId: string,
    gameCode: string,
    onRetryAttempt?: (
      attempt: number,
      maxRetries: number,
      reason?: string
    ) => void
  ): Promise<{ hostId: string; gameCode: string }> {
    let lastError: Error | null = null;
    let currentHostId = hostId;
    let currentGameCode = gameCode;

    for (
      let attempt = 0;
      attempt < RECONNECTION_CONFIG.MAX_RETRIES;
      attempt++
    ) {
      try {
        // Notify about retry attempt if this isn't the first attempt
        if (attempt > 0 && onRetryAttempt) {
          const reason = isPeerJSIdConflictError(lastError!)
            ? 'Game ID conflict detected'
            : 'Connection failed';
          onRetryAttempt(attempt + 1, RECONNECTION_CONFIG.MAX_RETRIES, reason);
        }

        await this.networkManager.initialize(true, currentHostId);

        // Host is ready to accept reconnections from previous peers
        console.log(
          `Host reconnected with ID: ${currentHostId}, game code: ${currentGameCode} (attempt ${attempt + 1})`
        );

        // If we had to generate a new game code, update the session
        if (currentGameCode !== gameCode) {
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
            console.log(
              `Updated session with new game code: ${currentGameCode}`
            );
          }
        }

        return { hostId: currentHostId, gameCode: currentGameCode }; // Success!
      } catch (error) {
        lastError = error as Error;
        console.warn(`Host reconnection attempt ${attempt + 1} failed:`, error);

        // Check if this looks like an ID conflict error using the helper function
        const isIdConflict = isPeerJSIdConflictError(lastError);

        // If this isn't the last attempt, prepare for retry
        if (attempt < RECONNECTION_CONFIG.MAX_RETRIES - 1) {
          // For ID conflicts, generate a new game code after the first few attempts
          if (isIdConflict && attempt >= 1) {
            const { generateGameCode, gameCodeToHostId } = await import(
              '~/utils/gameCode'
            );
            currentGameCode = generateGameCode();
            currentHostId = gameCodeToHostId(currentGameCode);
            console.log(
              `ID conflict detected, generated new game code: ${currentGameCode} with host ID: ${currentHostId}`
            );

            // Clean up the old network manager before trying with the new ID
            this.networkManager.disconnect();
          }

          const delay =
            RECONNECTION_CONFIG.INITIAL_RETRY_DELAY_MS *
            Math.pow(RECONNECTION_CONFIG.RETRY_BACKOFF_MULTIPLIER, attempt);
          console.log(`Retrying host reconnection in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    // If we get here, all attempts failed
    throw new Error(
      `Host reconnection failed after ${RECONNECTION_CONFIG.MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );
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

        console.log(`Client reconnection successful on attempt ${attempt + 1}`);
        return; // Success!
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Client reconnection attempt ${attempt + 1} failed:`,
          error
        );

        // If this isn't the last attempt, wait before retrying
        if (attempt < RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS - 1) {
          const delay =
            RECONNECTION_CONFIG.CLIENT_POLL_INTERVAL_MS *
            Math.pow(
              RECONNECTION_CONFIG.CLIENT_POLL_BACKOFF_MULTIPLIER,
              attempt
            );
          console.log(`Retrying client reconnection in ${delay}ms...`);
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
