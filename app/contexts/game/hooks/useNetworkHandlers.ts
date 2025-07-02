import { useEffect, useRef, useCallback } from "react";
import { GameNetworkService } from "../services/networkService";
import { createMessageHandlers } from "../../handlers";
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

  const handleMessage = useCallback((messageType: string, handler: any) => {
    return (message: GameMessage, senderId: string) => {
      const networkManager = networkService.getNetworkManager();
      if (!networkManager) return;

      handler(message, senderId, {
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
      });
    };
  }, [networkService]);

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

  useEffect(() => {
    const networkManager = networkService.getNetworkManager();
    if (!networkManager) return;

    const messageHandlers = createMessageHandlers();

    Object.entries(messageHandlers).forEach(([messageType, handler]) => {
      networkService.registerMessageHandler(messageType, handleMessage(messageType, handler));
    });
  }, [networkService, handleMessage]);
}
