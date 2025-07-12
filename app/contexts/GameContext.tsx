import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAutoBroadcast } from '~/hooks/useAutoBroadcast';
import { useAutoGamesave } from '~/hooks/useAutoGamesave';
import { useConnectionActions } from '~/hooks/useConnectionActions';
import { useGameActions } from '~/hooks/useGameActions';
import { useNetworkService } from '~/hooks/useNetworkService';
import type { ConnectionStatus } from '~/network/networkManager';
import { gameStore as useGameStore } from '~/store/gameStore';
import type { GameContextType, GameProviderProps } from '~/types/gameContext';
import { useSession } from './SessionContext';

const GameContext = createContext<GameContextType | null>(null);

function useGameProvider() {
  const networkService = useNetworkService();
  const sessionManager = useSession();
  const gameActions = useGameActions(networkService);
  const gameStore = useGameStore();

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useAutoBroadcast(networkService);
  useAutoGamesave(connectionStatus);

  const connectionActions = useConnectionActions(
    networkService,
    connectionStatus,
    sessionManager,
    setConnectionStatus
  );

  // Handle when a player gets kicked from the game
  const handleKicked = useCallback(
    (message: string) => connectionActions.leaveGame('kicked', { message }),
    [connectionActions]
  );

  // Configure and update network service with game state and handlers
  useEffect(() => {
    networkService.configure({
      gameStore: gameStore,
      handleKicked,
      setConnectionStatus,
      sessionManager: {
        saveSession: sessionManager.saveSession,
        updateSession: sessionManager.updateSession,
        clearSession: sessionManager.clearSession,
        sessionData: sessionManager.sessionData,
      },
    });
  }, [
    networkService,
    gameStore,
    handleKicked,
    setConnectionStatus,
    sessionManager.saveSession,
    sessionManager.updateSession,
    sessionManager.clearSession,
    sessionManager.sessionData,
  ]);

  return {
    networkManager: networkService.getNetworkManager(),
    connectionStatus,
    ...connectionActions,
    ...gameActions,
  };
}

export function GameProvider({ children }: GameProviderProps) {
  const contextValue = useGameProvider();

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
}
