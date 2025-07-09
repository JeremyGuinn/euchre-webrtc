import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSession } from '~/contexts/SessionContext';
import { GameNetworkService } from '~/services/networkService';
import { useGameStore } from '~/store/gameStore';
import { shouldAttemptAutoReconnection } from '~/utils/reconnection';

import type { GameContextType, ReconnectionStatus } from '~/types/gameContext';
import type { ConnectionStatus } from '~/utils/networking';
import { useConnectionActions } from './useConnectionActions';
import { useGameActions } from './useGameActions';
import { useGameStateEffects } from './useGameStateEffects';
import { useGameStatePersistence } from './useGameStatePersistence';
import { useGameUtils } from './useGameUtils';

export function useGameProvider() {
  const sessionManager = useSession();

  // Check for existing session to determine initial connection status
  const getInitialConnectionStatus = (): ConnectionStatus => {
    const session = sessionManager.sessionData;

    if (session && shouldAttemptAutoReconnection(session)) {
      return 'reconnecting'; // Start in reconnecting state if we have a valid session
    }

    return 'disconnected';
  };

  // Core state - using Zustand store
  const gameState = useGameStore();

  // Initialize the game state with default values
  useEffect(() => {
    if (!gameState.id) {
      gameState.updateGameOptions({
        allowReneging: false,
        teamSelection: 'predetermined',
        dealerSelection: 'first_black_jack',
        screwTheDealer: false,
        farmersHand: false,
      });
    }
  }, [gameState]);

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

  const connectionActions = useConnectionActions(
    networkService,
    connectionStatus,
    myPlayerId,
    isHost,
    sessionManager,
    setMyPlayerId,
    setIsHost,
    setConnectionStatus,
    setReconnectionStatus
  );

  // Handle when a player gets kicked from the game
  const handleKicked = useCallback(
    (message: string) => connectionActions.leaveGame('kicked', { message }),
    [connectionActions]
  );

  // Configure and update network service with game state and handlers
  useEffect(() => {
    networkService.configure({
      gameState,
      gameStore: gameState, // Pass the Zustand store as gameStore
      myPlayerId,
      isHost,
      broadcastGameState,
      handleKicked,
      setConnectionStatus,
      setMyPlayerId,
      setIsHost,
      pollForHostReconnection: connectionActions.pollForHostReconnection,
      sessionManager: {
        saveSession: sessionManager.saveSession,
        updateSession: sessionManager.updateSession,
        clearSession: sessionManager.clearSession,
        sessionData: sessionManager.sessionData,
      },
    });
  }, [
    networkService,
    gameState,
    myPlayerId,
    isHost,
    broadcastGameState,
    handleKicked,
    setConnectionStatus,
    setMyPlayerId,
    setIsHost,
    connectionActions.pollForHostReconnection,
    sessionManager.saveSession,
    sessionManager.updateSession,
    sessionManager.clearSession,
    sessionManager.sessionData,
  ]);

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
      const session = sessionManager.sessionData;
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

  const gameActions = useGameActions(myPlayerId, isHost, networkService);

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
  };

  return contextValue;
}
