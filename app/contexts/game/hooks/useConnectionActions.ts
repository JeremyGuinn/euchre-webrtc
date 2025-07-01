import { useCallback } from "react";
import { gameCodeToUuid } from "../../../utils/gameCode";
import { SessionStorageService } from "../services/sessionService";
import { GameNetworkService } from "../services/networkService";
import type { GameMessage } from "../../../types/messages";
import { createMessageId } from "../../../utils/protocol";
import type { GameAction } from "../../../utils/gameState";

export function useConnectionActions(
  networkService: GameNetworkService,
  connectionStatus: "disconnected" | "connecting" | "connected" | "error",
  setMyPlayerId: (id: string) => void,
  setIsHost: (isHost: boolean) => void,
  setConnectionStatus: (status: "disconnected" | "connecting" | "connected" | "error") => void,
  dispatch: React.Dispatch<GameAction>
) {
  const hostGame = useCallback(async (): Promise<string> => {
    // Prevent initialization if already connected
    if (connectionStatus === "connected" || connectionStatus === "connecting") {
      throw new Error("Cannot host game: already connected to a game");
    }

    // Clear any existing session data when starting a new game
    SessionStorageService.clearSession();

    const { gameCode, hostId, gameUuid } = await networkService.hostGame();
    
    setMyPlayerId(hostId);
    setIsHost(true);

    // Initialize the game state
    dispatch({
      type: "INIT_GAME",
      payload: { hostId, gameId: gameUuid },
    });

    return gameCode;
  }, [connectionStatus, networkService, setMyPlayerId, setIsHost, dispatch]);

  const joinGame = useCallback(
    async (gameCode: string, playerName: string): Promise<void> => {
      // Prevent initialization if already connected
      if (connectionStatus === "connected" || connectionStatus === "connecting") {
        throw new Error("Cannot join game: already connected to a game");
      }

      const playerId = await networkService.joinGame(gameCode, playerName);
      setMyPlayerId(playerId);
      setIsHost(false);
    },
    [connectionStatus, networkService, setMyPlayerId, setIsHost, dispatch]
  );

  const disconnect = useCallback(() => {
    networkService.disconnect();
    setConnectionStatus("disconnected");
    setMyPlayerId("");
    setIsHost(false);
    SessionStorageService.clearSession();
  }, [networkService, setConnectionStatus, setMyPlayerId, setIsHost, dispatch]);

  return {
    hostGame,
    joinGame,
    disconnect,
  };
}
