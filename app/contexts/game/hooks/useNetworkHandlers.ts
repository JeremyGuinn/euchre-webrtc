import { useEffect } from "react";
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
  // Initialize network event handlers
  useEffect(() => {
    networkService.setStatusChangeHandler((status) => {
      console.log("Network status changed:", status);
      setConnectionStatus?.(status);
    });

    networkService.setConnectionChangeHandler((peerId, connected) => {
      dispatch({
        type: "UPDATE_PLAYER_CONNECTION",
        payload: { playerId: peerId, isConnected: connected },
      });
    });
  }, [networkService, dispatch, setConnectionStatus]);

  // Set up message handlers when network service changes
  useEffect(() => {
    const networkManager = networkService.getNetworkManager();
    if (!networkManager) return;

    // Create handler context
    const handlerContext: HandlerContext = {
      gameState,
      myPlayerId,
      isHost,
      dispatch,
      networkManager,
      broadcastGameState,
      onKicked,
      setConnectionStatus: setConnectionStatus || (() => {}),
      setMyPlayerId: setMyPlayerId || (() => {}),
      setIsHost: setIsHost || (() => {}),
    };

    // Create message handlers
    const messageHandlers = createMessageHandlers();

    // Register all message handlers with the current context
    Object.entries(messageHandlers).forEach(([messageType, handler]) => {
      networkService.registerMessageHandler(messageType, (message: GameMessage, senderId: string) => {
        // Cast handler to accept GameMessage to avoid type intersection issues
        (handler as MessageHandler<GameMessage>)(message, senderId, handlerContext);
      });
    });
  }, [
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
  ]);
}
