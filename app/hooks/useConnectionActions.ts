import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { type SessionContextType } from '~/contexts/SessionContext';
import { useLogger } from '~/hooks/useLogger';
import type { ConnectionStatus } from '~/network/networkManager';
import { GameStatePersistenceService } from '~/services/gameStatePersistenceService';
import { gameStore } from '~/store/gameStore';
import type { NetworkService } from '~/types/networkService';

export function useConnectionActions(
  networkService: NetworkService,
  connectionStatus: ConnectionStatus,
  sessionManager: SessionContextType,
  setConnectionStatus: (status: ConnectionStatus) => void
) {
  const navigate = useNavigate();
  const logger = useLogger('useConnectionActions');

  const isHost = gameStore.use.isHost();
  const setIsHost = gameStore.use.setIsHost();
  const myPlayerId = gameStore.use.myPlayerId();
  const setMyPlayerId = gameStore.use.setMyPlayerId();
  const initGame = gameStore.use.initGame();

  const hostGame = useCallback(async (): Promise<string> => {
    return logger.withPerformance('hostGame', async () => {
      logger.info('Starting to host game', {
        connectionStatus,
        myPlayerId: myPlayerId || 'none',
      });

      if (connectionStatus === 'connected') {
        const error = 'Cannot host game: already connected to a game';
        logger.error(error, { connectionStatus });
        throw new Error(error);
      }

      sessionManager.clearSession();
      logger.debug('Cleared previous session');

      const { gameCode, hostId, gameUuid } = await networkService.hostGame();
      logger.info('Game hosted successfully', { gameCode, hostId, gameUuid });

      setMyPlayerId(hostId);
      setIsHost(true);

      // Save session data for reconnection
      const sessionData = {
        playerId: hostId,
        gameId: gameUuid,
        gameCode,
        isHost: true,
        playerName: 'Host',
      };

      sessionManager.saveSession(sessionData);
      logger.debug('Session saved for reconnection', { sessionData });

      initGame(hostId, gameUuid, gameCode);
      logger.debug('Game initialization called');

      return gameCode;
    });
  }, [connectionStatus, networkService, setIsHost, gameStore, logger, sessionManager]);

  const joinGame = useCallback(
    async (gameCode: string, playerName: string): Promise<void> => {
      return logger.withPerformance('joinGame', async () => {
        logger.info('Attempting to join game', {
          gameCode,
          playerName,
          connectionStatus,
          myPlayerId: myPlayerId || 'none',
        });

        if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
          const error = 'Cannot join game: already connected to a game';
          logger.error(error, { connectionStatus });
          throw new Error(error);
        }

        sessionManager.clearSession();
        logger.debug('Cleared previous session');

        const playerId = await networkService.joinGame(gameCode, playerName);
        logger.info('Join game request sent', {
          gameCode,
          playerName,
          playerId,
        });

        setMyPlayerId(playerId);
        setIsHost(false);

        logger.debug('Player state updated', { playerId, isHost: false });

        // We'll save session data when we successfully join and get a game ID
        // This will be done in the JOIN_RESPONSE handler
        logger.debug('Session will be saved when JOIN_RESPONSE is received');
      });
    },
    [logger, connectionStatus, gameStore, sessionManager, networkService, setIsHost]
  );

  const leaveGame = useCallback(
    async (
      reason: 'manual' | 'error' | 'network' | 'kicked' = 'manual',
      additionalContext: Record<string, unknown> = {}
    ) => {
      return logger.withOperation('leaveGame', async () => {
        logger.info('Leaving game', {
          reason,
          isHost,
          connectionStatus,
          myPlayerId: myPlayerId || 'none',
          additionalContext,
        });

        setConnectionStatus('disconnected');
        setMyPlayerId('');
        setIsHost(false);
        sessionManager.clearSession();
        GameStatePersistenceService.clear();

        logger.debug('Player state and session cleared');

        // If we're a client (not host), send leave message first
        if (!isHost && connectionStatus === 'connected') {
          try {
            logger.debug('Sending leave message as client');
            await networkService.leaveGame(reason);
            logger.debug('Leave message sent successfully');
          } catch (error) {
            logger.warn('Failed to send leave message', {
              error: error instanceof Error ? error.message : String(error),
            });
            // If sending leave message fails, just disconnect normally
          }
        } else {
          logger.debug('Skipping leave message', {
            isHost,
            connectionStatus,
          });
        }

        switch (reason) {
          case 'manual':
          case 'error':
          case 'network':
            logger.info('Navigating to home', { reason });
            navigate('/');
            break;
          case 'kicked': {
            const kickMessage =
              'message' in additionalContext ? additionalContext.message : undefined;
            logger.info('Navigating to home with kick message', {
              reason,
              kickMessage,
            });
            navigate('/', {
              state: { kickMessage },
            });
            break;
          }
        }
      });
    },
    [
      networkService,
      isHost,
      connectionStatus,
      setConnectionStatus,
      gameStore,
      setIsHost,
      navigate,
      logger,
      sessionManager,
    ]
  );

  return {
    hostGame,
    joinGame,
    leaveGame,
  };
}
