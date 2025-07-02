import { useEffect, useRef, useCallback } from "react";
import { GameNetworkService } from "../services/networkService";
import { createMessageHandlers, type HandlerContext, type MessageHandler } from "../../handlers";
import type { GameMessage } from "../../../types/messages";
import type { GameState } from "../../../types/game";
import type { GameAction } from "../../../utils/gameState";

export function useNetworkHandlers(
  networkService: GameNetworkService,
  gameState: GameState,
  myPlayerId: string,
  isHost: boolean,
  dispatch: React.Dispatch<GameAction>,
  broadcastGameState: () => void,
  onKicked?: (message: string) => void,
  setConnectionStatus?: (status: "disconnected" | "connecting" | "connected" | "error") => void,
  setMyPlayerId?: (id: string) => void,
  setIsHost?: (isHost: boolean) => void
) {
  // Use refs to store current values without causing re-renders
  const stateRef = useRef({
    gameState,
    myPlayerId,
    isHost,
    dispatch,
    broadcastGameState,
    onKicked,
    setConnectionStatus,
    setMyPlayerId,
    setIsHost,
  });

  // Update refs on every render but don't trigger effects
  stateRef.current = {
    gameState,
    myPlayerId,
    isHost,
    dispatch,
    broadcastGameState,
    onKicked,
    setConnectionStatus,
    setMyPlayerId,
    setIsHost,
  };

  // Create stable message handler that uses current refs
  const handleMessage = useCallback((messageType: string, handler: any) => {
    return (message: GameMessage, senderId: string) => {
      const networkManager = networkService.getNetworkManager();
      if (!networkManager) return;

      // Create handler context with current values
      const handlerContext: HandlerContext = {
        gameState: stateRef.current.gameState,
        myPlayerId: stateRef.current.myPlayerId,
        isHost: stateRef.current.isHost,
        dispatch: stateRef.current.dispatch,
        networkManager,
        broadcastGameState: stateRef.current.broadcastGameState,
        onKicked: stateRef.current.onKicked,
        setConnectionStatus: stateRef.current.setConnectionStatus || (() => { }),
        setMyPlayerId: stateRef.current.setMyPlayerId || (() => { }),
        setIsHost: stateRef.current.setIsHost || (() => { }),
      };

      // Call handler with proper context
      handler(message, senderId, handlerContext);
    };
  }, [networkService]);

  // Initialize network event handlers only once
  useEffect(() => {
    networkService.setStatusChangeHandler((status) => {
      stateRef.current.setConnectionStatus?.(status);
    });

    networkService.setConnectionChangeHandler((peerId, connected) => {
      stateRef.current.dispatch({
        type: "UPDATE_PLAYER_CONNECTION",
        payload: { playerId: peerId, isConnected: connected },
      });
    });
  }, [networkService]);

  // Set up message handlers only when network service changes
  useEffect(() => {
    const networkManager = networkService.getNetworkManager();
    if (!networkManager) return;

    // Create message handlers once
    const messageHandlers = createMessageHandlers();

    // Register all message handlers with stable handlers
    Object.entries(messageHandlers).forEach(([messageType, handler]) => {
      networkService.registerMessageHandler(messageType, handleMessage(messageType, handler));
    });

    // Cleanup function to unregister handlers
    return () => {
      Object.keys(messageHandlers).forEach(messageType => {
        networkService.unregisterMessageHandler(messageType);
      });
    };
  }, [networkService, handleMessage]);
}
