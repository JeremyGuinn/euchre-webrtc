import { useReducer, useState, useMemo, useEffect } from "react";
import { gameReducer } from "../../../utils/gameState";
import { GameNetworkService } from "../services/networkService";
import { useConnectionActions } from "./useConnectionActions";
import { useGameActions } from "./useGameActions";
import { useGameUtils } from "./useGameUtils";
import { useGameStateEffects } from "./useGameStateEffects";
import { useNetworkHandlers } from "./useNetworkHandlers";
import type { GameContextType } from "../types";
import { v4 as uuidv4 } from "uuid";

interface UseGameProviderOptions {
  onKicked?: (message: string) => void;
}

export function useGameProvider(options: UseGameProviderOptions = {}) {
  const { onKicked } = options;

  // Core state
  const [gameState, dispatch] = useReducer(gameReducer, {
    id: "",
    players: [],
    options: {
      allowReneging: false,
      teamSelection: "predetermined",
      dealerSelection: "first_black_jack",
      screwTheDealer: false,
      farmersHand: false
    },
    phase: "lobby",
    currentDealerId: "",
    deck: [],
    hands: {},
    bids: [],
    completedTricks: [],
    scores: { team0: 0, team1: 0 },
    handScores: { team0: 0, team1: 0 },
  });

  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [myPlayerId, setMyPlayerId] = useState("");
  const [isHost, setIsHost] = useState(false);

  // Initialize network service - only recreate when truly disconnected
  const networkService = useMemo(() => {
    return new GameNetworkService();
  }, [connectionStatus === "disconnected" ? uuidv4() : 0]); // Force recreation only on disconnect

  // Game state effects (auto-broadcast, session storage)
  const { broadcastGameState } = useGameStateEffects(
    gameState,
    myPlayerId,
    isHost,
    connectionStatus,
    networkService
  );

  // Network handlers setup
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

  // Connection actions
  const connectionActions = useConnectionActions(
    networkService,
    connectionStatus,
    setMyPlayerId,
    setIsHost,
    setConnectionStatus,
    dispatch
  );

  // Game actions  
  const gameActions = useGameActions(
    gameState,
    myPlayerId,
    isHost,
    dispatch,
    networkService
  );

  // Game utilities
  const gameUtils = useGameUtils(gameState, myPlayerId);

  // Combine all the context values
  const contextValue: GameContextType = {
    // State
    gameState,
    networkManager: networkService.getNetworkManager(),
    myPlayerId,
    isHost,
    connectionStatus,

    // Connection actions
    ...connectionActions,

    // Game actions
    ...gameActions,

    // Utilities
    ...gameUtils,

    // Event callbacks
    onKicked,
  };

  return contextValue;
}
