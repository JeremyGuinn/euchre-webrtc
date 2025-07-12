import { useCallback, useRef } from 'react';
import type { SessionData } from '~/contexts/SessionContext';
import { useLogger } from '~/hooks/useLogger';
import { createMessageHandlers } from '~/network/handlers';
import { NetworkManager, type ConnectionStatus } from '~/network/networkManager';
import { createMessageId } from '~/network/protocol';
import type { GameStore } from '~/store/gameStore';
import type { HandlerContext } from '~/types/handlers';
import type { GameMessage } from '~/types/messages';
import type { NetworkService } from '~/types/networkService';
import { sleep } from '~/utils/async';
import { mapToUserFriendlyError } from '~/utils/errors';
import { gameCodeToHostId, generateGameCode } from '~/utils/game/gameCode';

export interface NetworkServiceConfig {
  gameStore: GameStore;
  handleKicked: (message: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError?: (message: string, code?: string) => void;
  sessionManager?: {
    saveSession: (data: Omit<SessionData, 'lastConnectionTime'>) => void;
    updateSession: (updates: Partial<Omit<SessionData, 'lastConnectionTime'>>) => void;
    clearSession: () => void;
    sessionData: SessionData | null;
  };
}

export function useNetworkService(): NetworkService {
  const logger = useLogger('useNetworkService');
  const networkManagerRef = useRef<NetworkManager>(new NetworkManager());
  const configRef = useRef<NetworkServiceConfig | null>(null);
  const messageHandlersRegisteredRef = useRef(false);

  // Get the network manager instance
  const networkManager = networkManagerRef.current;

  // Send message function
  const sendMessage = useCallback(
    (message: GameMessage, targetId?: string) => {
      logger.debug('Sending message', {
        messageType: message.type,
        messageId: message.messageId,
        targetId,
        timestamp: message.timestamp,
      });
      networkManager.sendMessage(message, targetId);
    },
    [logger, networkManager]
  );

  // Disconnect function
  const disconnect = useCallback(() => {
    logger.info('Disconnecting from network');
    networkManager.disconnect();
    logger.debug('Network disconnection completed');
  }, [logger, networkManager]);

  // Leave game function
  const leaveGame = useCallback(
    async (reason: 'manual' | 'error' | 'network' | 'kicked' = 'manual'): Promise<void> => {
      return logger.withOperation('leaveGame', async () => {
        logger.info('Leaving game', { reason });

        try {
          if (reason !== 'kicked') {
            logger.debug('Sending leave game message to host', { reason });

            // Send leave message to host before disconnecting
            networkManager.sendMessage({
              type: 'LEAVE_GAME',
              timestamp: Date.now(),
              messageId: createMessageId(),
              payload: { reason },
            } as GameMessage);

            // Give a brief moment for the message to be sent before disconnecting
            await sleep(100);
            logger.debug('Leave message sent, waiting before disconnect');
          } else {
            logger.debug('Skipping leave message (kicked from game)');
          }
        } catch (error) {
          logger.error('Error sending leave game message', {
            error: error instanceof Error ? error.message : String(error),
            reason,
          });
        } finally {
          disconnect();
          logger.info('Game left successfully', { reason });
        }
      });
    },
    [logger, networkManager, disconnect]
  );

  // Host game function
  const hostGame = useCallback(async (): Promise<{
    gameCode: string;
    hostId: string;
    gameUuid: string;
  }> => {
    return logger.withPerformance('hostGame', async () => {
      logger.info('Starting to host game');

      const gameCode = generateGameCode();
      const hostId = gameCodeToHostId(gameCode);
      const gameUuid = crypto.randomUUID();

      logger.debug('Generated game identifiers', {
        gameCode,
        hostId,
        gameUuid,
      });

      await networkManager.initialize(true, hostId);

      logger.info('Game hosted successfully', {
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
  }, [logger, networkManager]);

  // Join game function
  const joinGame = useCallback(
    async (gameCode: string, playerName: string): Promise<string> => {
      return logger.withPerformance('joinGame', async () => {
        logger.info('Attempting to join game', { gameCode, playerName });

        const hostId = gameCodeToHostId(gameCode);
        logger.debug('Resolved host ID from game code', {
          gameCode,
          hostId,
        });

        const playerId = await networkManager.initialize(false);
        logger.debug('Network manager initialized', { playerId });

        await networkManager.connectToPeer(hostId);
        logger.debug('Connected to host peer', { hostId });

        const joinMessage = {
          type: 'JOIN_REQUEST',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { playerName },
        } as GameMessage;

        logger.debug('Sending join request', { message: joinMessage });
        networkManager.sendMessage(joinMessage, hostId);

        logger.info('Join game request sent successfully', {
          gameCode,
          playerName,
          playerId,
        });
        return playerId;
      });
    },
    [logger, networkManager]
  );

  // Get isHost status
  const isHost = useCallback(() => {
    if (!configRef.current) {
      logger.warn('Cannot determine host status before configuration');
      return false;
    }
    const myPlayer = configRef.current.gameStore.players.find(
      p => p.id === configRef.current!.gameStore.myPlayerId
    );

    return myPlayer?.isHost ?? false;
  }, [logger]);

  // Handle incoming messages with proper context
  const handleMessageWithContext = useCallback(
    (
      message: GameMessage,
      senderId: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: any
    ) => {
      if (!configRef.current) {
        logger.error('Cannot handle message without configuration', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
        });
        return;
      }

      logger.debug('Processing message with context', {
        messageType: message.type,
        messageId: message.messageId,
        senderId,
        gamePhase: configRef.current.gameStore.phase,
        myPlayerId: configRef.current.gameStore.myPlayerId,
        isHost: isHost(),
      });

      const context: HandlerContext = {
        myPlayerId: configRef.current.gameStore.myPlayerId,
        isHost: isHost(),
        gameStore: configRef.current.gameStore,
        networkManager,
        handleKicked: configRef.current.handleKicked,
        setConnectionStatus: configRef.current.setConnectionStatus,
        setError: configRef.current.setError,
        sessionManager: configRef.current.sessionManager,
      };

      try {
        handler(message, senderId, context);
        logger.debug('Message handled successfully', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
        });
      } catch (error) {
        logger.error('Error handling message', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [logger, networkManager, isHost]
  );

  // Handle connection changes
  const handleConnectionChange = useCallback(
    (peerId: string, connected: boolean) => {
      if (!configRef.current) return;

      logger.info('Peer connection changed', {
        peerId,
        connected,
        isHost: isHost(),
        gamePhase: configRef.current.gameStore.phase,
      });

      configRef.current.gameStore.updatePlayerConnection(peerId, connected);
    },
    [logger, isHost]
  );

  // Set up network event handlers
  const setupNetworkHandlers = useCallback(() => {
    if (!configRef.current) return;

    logger.debug('Setting up network event handlers');

    networkManager.onStatusChange((status, { message, error } = {}) => {
      logger.info('Network status changed', { status });
      configRef.current?.setConnectionStatus(status);

      if (message) {
        logger.debug('Network status change message', { message, error, status });
        configRef.current?.setError?.(mapToUserFriendlyError(message, status, error), status);
      }
    });

    networkManager.onConnectionChange((peerId, connected) => {
      handleConnectionChange(peerId, connected);
    });

    logger.debug('Network event handlers setup complete');
  }, [logger, networkManager, handleConnectionChange]);

  // Set up message handlers
  const setupMessageHandlers = useCallback(() => {
    if (!configRef.current || messageHandlersRegisteredRef.current) return;

    logger.debug('Setting up message handlers');
    const messageHandlers = createMessageHandlers();
    const handlerCount = Object.keys(messageHandlers).length;

    logger.info('Setting up message handlers', { handlerCount });

    Object.entries(messageHandlers).forEach(([messageType, handler]) => {
      logger.debug('Registering message handler', { messageType });
      networkManager.onMessage(messageType, (message, senderId) => {
        handleMessageWithContext(message, senderId, handler);
      });
    });

    messageHandlersRegisteredRef.current = true;
    logger.info('Message handlers registration complete', {
      handlerCount,
      messageTypes: Object.keys(messageHandlers),
    });
  }, [logger, networkManager, handleMessageWithContext]);

  // Configure the network service
  const configure = useCallback(
    (config: NetworkServiceConfig) => {
      logger.debug('Configuring network service', {
        isHost: isHost(),
        gamePhase: config.gameStore.phase,
        playerCount: config.gameStore.players.length,
      });

      configRef.current = config;

      // Only set up handlers once
      if (!messageHandlersRegisteredRef.current) {
        setupNetworkHandlers();
        setupMessageHandlers();
      }
    },
    [logger, isHost, setupNetworkHandlers, setupMessageHandlers]
  );

  // Update configuration
  const updateConfig = useCallback(
    (updates: Partial<NetworkServiceConfig>) => {
      if (!configRef.current) {
        logger.warn('Cannot update config before initial configuration');
        return;
      }

      configRef.current = { ...configRef.current, ...updates };
      logger.debug('Network service configuration updated', {
        myPlayerId: configRef.current.gameStore.myPlayerId,
        isHost: isHost(),
        gamePhase: configRef.current.gameStore.phase,
      });
    },
    [logger, isHost]
  );

  // Get network manager (for compatibility)
  const getNetworkManager = useCallback((): NetworkManager => {
    return networkManager;
  }, [networkManager]);

  return {
    sendMessage,
    disconnect,
    leaveGame,
    hostGame,
    joinGame,
    configure,
    updateConfig,
    getNetworkManager,
  };
}
