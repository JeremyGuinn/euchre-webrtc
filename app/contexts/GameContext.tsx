import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useConnectionActions } from '~/hooks/useConnectionActions';
import { useGameActions } from '~/hooks/useGameActions';

import { useGameStateEffects } from '~/hooks/useGameStateEffects';
import { useGameStatePersistence } from '~/hooks/useGameStatePersistence';
import type { ConnectionStatus } from '~/network/networkManager';
import { GameNetworkService } from '~/services/networkService';
import { useGameStore } from '~/store/gameStore';
import type { GameContextType, GameProviderProps } from '~/types/gameContext';
import { useSession } from './SessionContext';

const GameContext = createContext<GameContextType | null>(null);

function useGameProvider() {
  const networkService = useMemo(() => new GameNetworkService(), []);
  const sessionManager = useSession();
  const gameActions = useGameActions(networkService);
  const gameStore = useGameStore();

  // Check for existing session to determine initial connection status
  const getInitialConnectionStatus = (): ConnectionStatus => {
    return 'disconnected';
  };

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    getInitialConnectionStatus()
  );

  useGameStateEffects(networkService);
  useGameStatePersistence(connectionStatus);

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
      gameStore,
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
    gameStore.deck,
    handleKicked,
    setConnectionStatus,
    sessionManager.saveSession,
    sessionManager.updateSession,
    sessionManager.clearSession,
    sessionManager.sessionData,
  ]);

  return {
    gameState: gameStore,
    networkManager: networkService.getNetworkManager(),
    myPlayerId: gameStore.myPlayerId,
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
