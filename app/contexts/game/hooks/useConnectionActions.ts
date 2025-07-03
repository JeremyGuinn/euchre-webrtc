import { useCallback } from 'react';

import type { ConnectionStatus } from '~/utils/networking';
import type { GameAction } from '../../../utils/gameState';
import { GameNetworkService } from '../services/networkService';
import { SessionStorageService } from '../services/sessionService';

export function useConnectionActions(
  networkService: GameNetworkService,
  connectionStatus: ConnectionStatus,
  setMyPlayerId: (id: string) => void,
  setIsHost: (isHost: boolean) => void,
  setConnectionStatus: (status: ConnectionStatus) => void,
  dispatch: React.Dispatch<GameAction>
) {
  const hostGame = useCallback(async (): Promise<string> => {
    if (connectionStatus === 'connected') {
      throw new Error('Cannot host game: already connected to a game');
    }

    SessionStorageService.clearSession();

    const { gameCode, hostId, gameUuid } = await networkService.hostGame();

    setMyPlayerId(hostId);
    setIsHost(true);

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

  return {
    hostGame,
    joinGame,
    disconnect,
  };
}
