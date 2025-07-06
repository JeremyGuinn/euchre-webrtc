import { useEffect, useMemo, useReducer, useState } from 'react';

import { GameNetworkService } from '~/services/networkService';
import { SessionStorageService } from '~/services/sessionService';
import { gameReducer } from '~/utils/gameState';
import { shouldAttemptAutoReconnection } from '~/utils/reconnection';

import type { GameContextType } from '~/types/gameContext';
import type { ConnectionStatus } from '~/utils/networking';
import { useConnectionActions } from './useConnectionActions';
import { useGameActions } from './useGameActions';
import { useGameStateEffects } from './useGameStateEffects';
import { useGameStatePersistence } from './useGameStatePersistence';
import { useGameUtils } from './useGameUtils';
import { useNetworkHandlers } from './useNetworkHandlers';

interface UseGameProviderOptions {
  onKicked?: (message: string) => void;
}

export function useGameProvider(options: UseGameProviderOptions = {}) {
  const { onKicked } = options;

  // Check for existing session to determine initial connection status
  const getInitialConnectionStatus = (): ConnectionStatus => {
    const session = SessionStorageService.getSession();
    if (session && shouldAttemptAutoReconnection(session)) {
      return 'reconnecting'; // Start in reconnecting state if we have a valid session
    }
    return 'disconnected';
  };

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

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    getInitialConnectionStatus()
  );
  const [myPlayerId, setMyPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);

  const networkService = useMemo(() => new GameNetworkService(), []);

  const { broadcastGameState } = useGameStateEffects(
    gameState,
    myPlayerId,
    isHost,
    networkService
  );

  useGameStatePersistence(gameState, isHost, connectionStatus);

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

  // Check for existing session and attempt reconnection on mount
  useEffect(() => {
    let isCancelled = false;

    const attemptAutoReconnection = async () => {
      if (isCancelled) {
        return; // Effect was cancelled
      }

      // Only attempt reconnection if we're in reconnecting state (which means we had a valid session)
      if (connectionStatus === 'reconnecting') {
        console.log('Starting auto-reconnection...');
        const success = await connectionActions.attemptReconnection();
        if (success) {
          console.log('Auto-reconnection succeeded');
        } else {
          console.log('Auto-reconnection failed');
          setConnectionStatus('disconnected');
        }
      }
    };

    // Start immediately if we're in reconnecting state, otherwise don't attempt
    if (connectionStatus === 'reconnecting') {
      attemptAutoReconnection();
    }

    return () => {
      isCancelled = true;
    };
  }, [connectionActions, connectionStatus]);

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
