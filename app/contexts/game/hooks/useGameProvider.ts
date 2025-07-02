import { useReducer, useState, useMemo } from "react";
import { gameReducer } from "../../../utils/gameState";
import { GameNetworkService } from "../services/networkService";
import { useConnectionActions } from "./useConnectionActions";
import { useGameActions } from "./useGameActions";
import { useGameUtils } from "./useGameUtils";
import { useGameStateEffects } from "./useGameStateEffects";
import { useNetworkHandlers } from "./useNetworkHandlers";
import type { GameContextType } from "../types";

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
