import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { GameStatePersistenceService } from '~/services/gameStatePersistenceService';
import { GameNetworkService } from '~/services/networkService';
import { SessionStorageService } from '~/services/sessionService';
import type { GameAction } from '~/utils/gameState';
import type { ConnectionStatus } from '~/utils/networking';
import {
  RECONNECTION_CONFIG,
  shouldAttemptAutoReconnection,
  withTimeout,
} from '~/utils/reconnection';

export function useConnectionActions(
  networkService: GameNetworkService,
  connectionStatus: ConnectionStatus,
  setMyPlayerId: (id: string) => void,
  setIsHost: (isHost: boolean) => void,
  setConnectionStatus: (status: ConnectionStatus) => void,
  dispatch: React.Dispatch<GameAction>
) {
  const navigate = useNavigate();

  const hostGame = useCallback(async (): Promise<string> => {
    if (connectionStatus === 'connected') {
      throw new Error('Cannot host game: already connected to a game');
    }

    SessionStorageService.clearSession();

    const { gameCode, hostId, gameUuid } = await networkService.hostGame();

    setMyPlayerId(hostId);
    setIsHost(true);

    // Save session data for reconnection
    SessionStorageService.saveSession({
      playerId: hostId,
      gameId: gameUuid,
      gameCode,
      isHost: true,
      playerName: 'Host',
    });

    dispatch({
      type: 'INIT_GAME',
      payload: { hostId, gameId: gameUuid, gameCode },
    });

    return gameCode;
  }, [connectionStatus, networkService, setMyPlayerId, setIsHost, dispatch]);

  const joinGame = useCallback(
    async (gameCode: string, playerName: string): Promise<void> => {
      if (
        connectionStatus === 'connected' ||
        connectionStatus === 'connecting'
      ) {
        const error = 'Cannot join game: already connected to a game';
        console.error('useConnectionActions:', error);
        throw new Error(error);
      }

      SessionStorageService.clearSession();

      const playerId = await networkService.joinGame(gameCode, playerName);
      setMyPlayerId(playerId);
      setIsHost(false);

      // We'll save session data when we successfully join and get a game ID
      // This will be done in the JOIN_RESPONSE handler
    },
    [connectionStatus, networkService, setMyPlayerId, setIsHost]
  );

  const disconnect = useCallback(() => {
    networkService.disconnect();
    setConnectionStatus('disconnected');
    setMyPlayerId('');
    setIsHost(false);
    SessionStorageService.clearSession();
  }, [networkService, setConnectionStatus, setMyPlayerId, setIsHost]);

  const attemptReconnection = useCallback(async (): Promise<boolean> => {
    const session = SessionStorageService.getSession();
    if (!session || !session.gameCode) {
      return false;
    }

    // Check if we should attempt auto-reconnection based on time
    if (!shouldAttemptAutoReconnection(session)) {
      console.log('Session too old for auto-reconnection');
      SessionStorageService.clearSession();
      return false;
    }

    try {
      setConnectionStatus('reconnecting');

      if (session.isHost) {
        // Reconnect as host with timeout
        await withTimeout(
          networkService.reconnectAsHost(session.playerId, session.gameCode),
          RECONNECTION_CONFIG.TIMEOUT_MS,
          'Host reconnection timed out'
        );
        setMyPlayerId(session.playerId);
        setIsHost(true);

        // Try to restore the full game state from localStorage
        const savedGameState = GameStatePersistenceService.loadGameState(
          session.gameId
        );

        if (savedGameState) {
          // Restore the complete game state
          dispatch({
            type: 'RESTORE_GAME_STATE',
            payload: { gameState: savedGameState },
          });
          console.log('Host reconnected with saved game state');
        } else {
          // If no saved state, we'll return to home
          navigate('/');
        }

        SessionStorageService.updateLastConnectionTime();
        setConnectionStatus('connected');
        console.log('Host reconnected successfully');
        return true;
      } else {
        // Reconnect as client with timeout
        const playerName = session.playerName || 'Reconnecting Player';
        await withTimeout(
          networkService.reconnectAsClient(
            session.gameCode,
            session.playerId,
            playerName
          ),
          RECONNECTION_CONFIG.TIMEOUT_MS,
          'Client reconnection timed out'
        );

        // Update to the new peer ID that was generated during reconnection
        const newPeerId = networkService.getNetworkManager()?.myId;
        if (newPeerId) {
          setMyPlayerId(newPeerId);
        }
        setIsHost(false);

        SessionStorageService.updateLastConnectionTime();
        // Connection status will be updated when we receive JOIN_RESPONSE
        console.log('Client reconnection attempt started');
        return true;
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      setConnectionStatus('error');

      // Clear session if reconnection failed
      setTimeout(() => {
        SessionStorageService.clearSession();
        setConnectionStatus('disconnected');
      }, 3000); // Show error for 3 seconds before clearing

      return false;
    }
  }, [
    networkService,
    setConnectionStatus,
    setMyPlayerId,
    setIsHost,
    dispatch,
    navigate,
  ]);

  return {
    hostGame,
    joinGame,
    disconnect,
    attemptReconnection,
  };
}
