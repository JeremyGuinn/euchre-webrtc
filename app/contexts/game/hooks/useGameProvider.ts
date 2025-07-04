import { useMemo, useReducer, useState } from 'react';

import { gameReducer } from '../../../utils/gameState';
import { GameNetworkService } from '../services/networkService';
import type { GameContextType } from '../types';

import type { ConnectionStatus } from '~/utils/networking';
import { useConnectionActions } from './useConnectionActions';
import { useGameActions } from './useGameActions';
import { useGameStateEffects } from './useGameStateEffects';
import { useGameUtils } from './useGameUtils';
import { useNetworkHandlers } from './useNetworkHandlers';

interface UseGameProviderOptions {
  onKicked?: (message: string) => void;
}

export function useGameProvider(options: UseGameProviderOptions = {}) {
  const { onKicked } = options;

  // Core state
  const [gameState, dispatch] = useReducer(gameReducer, {
    id: '',
    players: [],
    teamNames: { team0: 'Team 1', team1: 'Team 2' },
    options: {
      allowReneging: false,
      teamSelection: 'predetermined',
      dealerSelection: 'first_black_jack',
      screwTheDealer: false,
      farmersHand: false,
    },
    phase: 'lobby',
    currentDealerId: '',
    deck: [],
    hands: {},
    bids: [],
    completedTricks: [],
    scores: { team0: 0, team1: 0 },
    handScores: { team0: 0, team1: 0 },
  });

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [myPlayerId, setMyPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);

  const networkService = useMemo(() => new GameNetworkService(), []);

  const { broadcastGameState } = useGameStateEffects(
    gameState,
    myPlayerId,
    isHost,
    networkService
  );

  useNetworkHandlers(
    networkService,
    gameState,
    myPlayerId,
    isHost,
    dispatch,
    broadcastGameState,
    onKicked,
    setConnectionStatus,
    setMyPlayerId,
    setIsHost
  );

  const connectionActions = useConnectionActions(
    networkService,
    connectionStatus,
    setMyPlayerId,
    setIsHost,
    setConnectionStatus,
    dispatch
  );

  const gameActions = useGameActions(
    gameState,
    myPlayerId,
    isHost,
    dispatch,
    networkService
  );

  const gameUtils = useGameUtils(gameState, myPlayerId);

  const contextValue: GameContextType = {
    gameState,
    networkManager: networkService.getNetworkManager(),
    myPlayerId,
    isHost,
    connectionStatus,
    ...connectionActions,
    ...gameActions,
    ...gameUtils,
    onKicked,
  };

  return contextValue;
}
