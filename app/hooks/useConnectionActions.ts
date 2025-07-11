import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { type SessionContextType } from '~/contexts/SessionContext';
import type { ConnectionStatus } from '~/network/networkManager';
import { RECONNECTION_CONFIG, shouldAttemptAutoReconnection } from '~/network/reconnection';
import { GameStatePersistenceService } from '~/services/gameStatePersistenceService';
import { createScopedLogger } from '~/services/loggingService';
import { GameNetworkService } from '~/services/networkService';
import { useGameStore } from '~/store/gameStore';
import type { ReconnectionStatus } from '~/types/gameContext';
import { withTimeout } from '~/utils/async';

export function useConnectionActions(
  networkService: GameNetworkService,
  connectionStatus: ConnectionStatus,
  isHost: boolean,
  sessionManager: SessionContextType,
  setIsHost: (isHost: boolean) => void,
  setConnectionStatus: (status: ConnectionStatus) => void,
  setReconnectionStatus: (status: ReconnectionStatus) => void
) {
  const navigate = useNavigate();
  const logger = createScopedLogger('useConnectionActions');
  const gameStore = useGameStore();

  const hostGame = useCallback(async (): Promise<string> => {
    return logger.withPerformance('hostGame', async () => {
      logger.info('Starting to host game', {
        connectionStatus,
        myPlayerId: gameStore.myPlayerId || 'none',
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

      gameStore.setMyPlayerId(hostId);

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

      gameStore.initGame(hostId, gameUuid, gameCode);
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
          myPlayerId: gameStore.myPlayerId || 'none',
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

        gameStore.setMyPlayerId(playerId);
        setIsHost(false);
        logger.debug('Player state updated', { playerId, isHost: false });

        // Update network service configuration immediately with the new playerId
        // This ensures the message handlers have the correct context when JOIN_RESPONSE arrives
        networkService.updateConfig({
          isHost: false,
        });

        // We'll save session data when we successfully join and get a game ID
        // This will be done in the JOIN_RESPONSE handler
        logger.debug('Session will be saved when JOIN_RESPONSE is received');
      });
    },
    [connectionStatus, networkService, setIsHost, logger, sessionManager]
  );

  const attemptReconnection = useCallback(async (): Promise<boolean> => {
    return logger.withPerformance('attemptReconnection', async () => {
      logger.info('Starting reconnection attempt');

      const session = sessionManager.sessionData;
      if (!session || !session.gameCode) {
        logger.warn('No session found for reconnection');
        return false;
      }

      logger.debug('Session found for reconnection', {
        gameCode: session.gameCode,
        playerId: session.playerId,
        isHost: session.isHost,
        playerName: session.playerName,
      });

      // Check if we should attempt auto-reconnection based on time
      if (!shouldAttemptAutoReconnection(session)) {
        logger.warn('Auto-reconnection window expired, clearing session');
        sessionManager.clearSession();
        return false;
      }

      try {
        // Reset reconnection status
        setReconnectionStatus({
          isReconnecting: true,
          attempt: 0,
          maxRetries: 0,
        });
        logger.debug('Reconnection status reset');

        if (session.isHost) {
          logger.info('Attempting host reconnection', {
            hostId: session.playerId,
            gameCode: session.gameCode,
          });

          // Reconnect as host with timeout and retry callback
          const onRetryAttempt = (attempt: number, maxRetries: number, reason?: string) => {
            logger.debug('Host reconnection retry', {
              attempt,
              maxRetries,
              reason,
            });
            setReconnectionStatus({
              isReconnecting: true,
              attempt,
              maxRetries,
              reason,
            });
          };

          const reconnectionResult = await withTimeout(
            networkService.reconnectAsHost(session.playerId, session.gameCode, onRetryAttempt),
            RECONNECTION_CONFIG.TIMEOUT_MS,
            'Host reconnection timed out'
          );

          logger.info('Host reconnection successful', {
            hostId: reconnectionResult.hostId,
            gameCode: reconnectionResult.gameCode,
            gameCodeChanged: reconnectionResult.gameCode !== session.gameCode,
          });

          gameStore.setMyPlayerId(reconnectionResult.hostId);
          setIsHost(true);

          // Try to restore the full game state from localStorage
          const savedGameState = GameStatePersistenceService.loadGameState(session.gameId);

          if (savedGameState) {
            logger.debug('Restoring saved game state', {
              gameId: session.gameId,
              hasGameState: !!savedGameState,
            });

            // If game code changed, update the game state with the new code
            const gameStateToRestore =
              reconnectionResult.gameCode !== session.gameCode
                ? { ...savedGameState, gameCode: reconnectionResult.gameCode }
                : savedGameState;

            // Restore the complete game state
            gameStore.restoreGameState(gameStateToRestore);
            logger.debug('Game state restored successfully');
          } else {
            logger.warn('No saved game state found, returning to home');
            // If no saved state, we'll return to home
            navigate('/');
          }

          sessionManager.updateLastConnectionTime();
          setConnectionStatus('connected');

          // Reset reconnection status on success
          setReconnectionStatus({
            isReconnecting: false,
            attempt: 0,
            maxRetries: 0,
          });

          return true;
        } else {
          logger.info('Attempting client reconnection', {
            gameCode: session.gameCode,
            playerId: session.playerId,
            playerName: session.playerName,
          });

          // Reconnect as client with timeout
          const playerName = session.playerName || 'Reconnecting Player';
          await withTimeout(
            networkService.reconnectAsClient(session.gameCode, session.playerId, playerName),
            RECONNECTION_CONFIG.TIMEOUT_MS,
            'Client reconnection timed out'
          );

          // Update to the new peer ID that was generated during reconnection
          const newPeerId = networkService.getNetworkManager()?.myId;
          if (newPeerId) {
            logger.debug('Updated to new peer ID', {
              oldPeerId: session.playerId,
              newPeerId,
            });
            gameStore.setMyPlayerId(newPeerId);
          }
          setIsHost(false);

          sessionManager.updateLastConnectionTime();
          logger.info('Client reconnection successful');
          // Connection status will be updated when we receive JOIN_RESPONSE
          return true;
        }
      } catch (error) {
        logger.error('Reconnection failed', {
          error: error instanceof Error ? error.message : String(error),
          sessionGameCode: session.gameCode,
          sessionIsHost: session.isHost,
        });

        setConnectionStatus('error');

        // Reset reconnection status on failure
        setReconnectionStatus({
          isReconnecting: false,
          attempt: 0,
          maxRetries: 0,
        });

        // Clear session if reconnection failed
        setTimeout(() => {
          logger.debug('Clearing session after reconnection failure');
          sessionManager.clearSession();
          setConnectionStatus('disconnected');
        }, 3000); // Show error for 3 seconds before clearing

        return false;
      }
    });
  }, [
    networkService,
    setConnectionStatus,
    setIsHost,
    gameStore,
    navigate,
    setReconnectionStatus,
    logger,
    sessionManager,
  ]);

  const pollForHostReconnection = useCallback(async (): Promise<boolean> => {
    return logger.withPerformance('pollForHostReconnection', async () => {
      logger.info('Starting host reconnection polling');

      const session = sessionManager.sessionData;
      if (!session || !session.gameCode || session.isHost) {
        logger.warn('Cannot poll for host reconnection', {
          hasSession: !!session,
          hasGameCode: !!session?.gameCode,
          isHost: session?.isHost,
        });
        return false;
      }

      logger.debug('Session found for host reconnection polling', {
        gameCode: session.gameCode,
        playerId: session.playerId,
        playerName: session.playerName,
      });

      try {
        // Reset reconnection status
        setReconnectionStatus({
          isReconnecting: true,
          attempt: 0,
          maxRetries: RECONNECTION_CONFIG.CLIENT_POLL_MAX_ATTEMPTS,
        });
        logger.debug('Reconnection status reset for polling');

        const onRetryAttempt = (attempt: number, maxRetries: number, reason?: string) => {
          logger.debug('Host reconnection poll retry', {
            attempt,
            maxRetries,
            reason,
          });
          setReconnectionStatus({
            isReconnecting: true,
            attempt,
            maxRetries,
            reason,
          });
        };

        await networkService.pollReconnectAsClient(
          session.gameCode,
          session.playerId,
          session.playerName || 'Reconnecting Player',
          onRetryAttempt
        );

        logger.info('Host reconnection polling successful');

        // Update to the new peer ID that was generated during reconnection
        const newPeerId = networkService.getNetworkManager()?.myId;
        if (newPeerId) {
          logger.debug('Updated to new peer ID after polling', {
            oldPeerId: session.playerId,
            newPeerId,
          });
          gameStore.setMyPlayerId(newPeerId);
        }
        setIsHost(false);

        sessionManager.updateLastConnectionTime();
        setConnectionStatus('connected');

        // Reset reconnection status on success
        setReconnectionStatus({
          isReconnecting: false,
          attempt: 0,
          maxRetries: 0,
        });

        return true;
      } catch (error) {
        logger.error('Host reconnection polling failed', {
          error: error instanceof Error ? error.message : String(error),
          sessionGameCode: session.gameCode,
          sessionPlayerId: session.playerId,
        });

        setConnectionStatus('error');

        // Reset reconnection status on failure
        setReconnectionStatus({
          isReconnecting: false,
          attempt: 0,
          maxRetries: 0,
        });

        // Clear session if reconnection failed
        setTimeout(() => {
          logger.debug('Clearing session and navigating home after polling failure');
          sessionManager.clearSession();
          setConnectionStatus('disconnected');
          navigate('/');
        }, 3000); // Show error for 3 seconds before clearing

        return false;
      }
    });
  }, [
    logger,
    sessionManager,
    setReconnectionStatus,
    networkService,
    setIsHost,
    setConnectionStatus,
    gameStore,
    navigate,
  ]);

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
          myPlayerId: gameStore.myPlayerId || 'none',
          additionalContext,
        });

        setConnectionStatus('disconnected');
        gameStore.setMyPlayerId('');
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
    attemptReconnection,
    pollForHostReconnection,
  };
}
