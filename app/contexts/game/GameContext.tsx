import { createContext, useContext } from 'react';

import { useGameProvider } from '~/hooks/useGameProvider';
import { createScopedLogger } from '~/services/loggingService';
import type { GameContextType, GameProviderProps } from '~/types/gameContext';

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  const logger = createScopedLogger('GameContext');

  if (!context) {
    logger.error('useGame called outside of GameProvider');
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
}

export function GameProvider({ children, onKicked }: GameProviderProps) {
  const logger = createScopedLogger('GameProvider');

  logger.debug('GameProvider mounting');

  const contextValue = useGameProvider({ onKicked });

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
}
