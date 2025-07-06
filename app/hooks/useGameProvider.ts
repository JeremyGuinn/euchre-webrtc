import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { GameNetworkService } from '~/services/networkService';
import { SessionStorageService } from '~/services/sessionService';
import { gameReducer } from '~/utils/gameState';
import { shouldAttemptAutoReconnection } from '~/utils/reconnection';

import type { GameContextType, ReconnectionStatus } from '~/types/gameContext';
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
  const [reconnectionStatus, setReconnectionStatus] =
    useState<ReconnectionStatus>({
      isReconnecting: false,
      attempt: 0,
      maxRetries: 0,
    });

  const networkService = useMemo(() => new GameNetworkService(), []);

  const { broadcastGameState } = useGameStateEffects(
    gameState,
    myPlayerId,
    isHost,
    networkService
  );

  useGameStatePersistence(gameState, isHost, connectionStatus);

  // Handle page unload to send leave message
  useEffect(() => {
    const handleBeforeUnload = () => {
      // If we're a connected client, try to send a leave message
      if (!isHost && connectionStatus === 'connected') {
        // Use sendBeacon for reliability during page unload
        try {
          networkService.sendMessage({
            type: 'LEAVE_GAME',
            timestamp: Date.now(),
            messageId: `leave-${Date.now()}`,
            payload: { reason: 'manual' },
          });
        } catch {
          // If sendMessage fails, there's not much we can do during unload
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [networkService, isHost, connectionStatus]);

  const connectionActions = useConnectionActions(
    networkService,
    connectionStatus,
    myPlayerId,
    isHost,
    setMyPlayerId,
    setIsHost,
    setConnectionStatus,
    dispatch,
    setReconnectionStatus
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
    setIsHost,
    connectionActions.pollForHostReconnection
  );

  // Track if we've already attempted auto-reconnection to prevent infinite loops
  const hasAttemptedReconnection = useRef(false);

  // Check for existing session and attempt reconnection on mount
  useEffect(() => {
    // Only attempt once
    if (hasAttemptedReconnection.current) {
      return;
    }

    const attemptAutoReconnection = async () => {
      // Check if we have a valid session that should trigger auto-reconnection
      const session = SessionStorageService.getSession();
      if (session && shouldAttemptAutoReconnection(session)) {
        hasAttemptedReconnection.current = true;
        const success = await connectionActions.attemptReconnection();
        if (!success) {
          setConnectionStatus('disconnected');
        }
      }
    };

    attemptAutoReconnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - ignore ESLint warning about connectionActions

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
    reconnectionStatus,
    ...connectionActions,
    ...gameActions,
    ...gameUtils,
    onKicked,
  };

  return contextValue;
}
