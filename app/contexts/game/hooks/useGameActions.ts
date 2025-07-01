import { useCallback } from "react";
import type { Card, Bid, GameState } from "../../../types/game";
import type { GameMessage } from "../../../types/messages";
import { createMessageId } from "../../../utils/protocol";
import type { GameAction } from "../../../utils/gameState";
import { GameNetworkService } from "../services/networkService";

export function useGameActions(
  gameState: GameState,
  myPlayerId: string,
  isHost: boolean,
  dispatch: React.Dispatch<GameAction>,
  networkService: GameNetworkService
) {
  const startGame = useCallback(() => {
    if (!isHost) return;

    dispatch({ type: "START_GAME" });
    dispatch({ type: "DEAL_CARDS" });
    // State changes will trigger auto-broadcast via useEffect
  }, [isHost, dispatch]);

  const placeBid = useCallback(
    (suit: Card["suit"] | "pass", alone?: boolean) => {
      const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
      if (!myPlayer || gameState.currentPlayerId !== myPlayerId) return;

      const bid: Bid = {
        playerId: myPlayerId,
        suit,
        alone,
      };

      if (isHost) {
        dispatch({ type: "PLACE_BID", payload: { bid } });
        // State change will trigger auto-broadcast via useEffect
      } else {
        const message: GameMessage = {
          type: "BID",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { bid },
        };

        networkService.sendMessage(message);
      }
    },
    [gameState.players, gameState.currentPlayerId, myPlayerId, isHost, dispatch, networkService]
  );

  const playCard = useCallback(
    (card: Card) => {
      if (gameState.currentPlayerId !== myPlayerId) return;

      if (isHost) {
        dispatch({
          type: "PLAY_CARD",
          payload: { card, playerId: myPlayerId },
        });
        // State change will trigger auto-broadcast via useEffect
      } else {
        const message: GameMessage = {
          type: "PLAY_CARD",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { card },
        };

        networkService.sendMessage(message);
      }
    },
    [gameState.currentPlayerId, myPlayerId, isHost, dispatch, networkService]
  );

  const renamePlayer = useCallback(
    (playerId: string, newName: string): void => {
      // Allow if user is host OR if they're renaming themselves
      if (!isHost && playerId !== myPlayerId) return;

      // Update local state
      dispatch({
        type: "RENAME_PLAYER",
        payload: { playerId, newName }
      });

      if (playerId === myPlayerId) {
        // Player is renaming themselves - send message to others
        const message: GameMessage = {
          type: "RENAME_PLAYER",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { newName }
        };

        networkService.sendMessage(message);
      } else if (isHost) {
        // Host is renaming another player - state change will trigger auto-broadcast via useEffect
      }
    },
    [isHost, myPlayerId, dispatch, networkService]
  );

  const kickPlayer = useCallback(
    (playerId: string): void => {
      if (!isHost) return;

      // Remove player from local state
      dispatch({
        type: "KICK_PLAYER",
        payload: { playerId }
      });

      // Send kick message to all players
      const message: GameMessage = {
        type: "KICK_PLAYER",
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId }
      };

      networkService.sendMessage(message);
    },
    [isHost, dispatch, networkService]
  );

  const movePlayer = useCallback(
    (playerId: string, newPosition: 0 | 1 | 2 | 3): void => {
      if (!isHost) return;

      // Update local state
      dispatch({
        type: "MOVE_PLAYER",
        payload: { playerId, newPosition }
      });

      // Broadcast to all players
      const message: GameMessage = {
        type: "MOVE_PLAYER",
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId, newPosition }
      };

      networkService.sendMessage(message);
    },
    [isHost, dispatch, networkService]
  );

  return {
    startGame,
    placeBid,
    playCard,
    renamePlayer,
    kickPlayer,
    movePlayer,
  };
}
