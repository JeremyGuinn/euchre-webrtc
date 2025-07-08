import { createContext, useContext } from 'react';

import { useGameProvider } from '~/hooks/useGameProvider';
import type { GameContextType, GameProviderProps } from '~/types/gameContext';

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
}

export function GameProvider({ children }: GameProviderProps) {
  const contextValue = useGameProvider();

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
}
