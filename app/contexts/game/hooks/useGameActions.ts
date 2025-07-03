import { useCallback } from "react";
import type { Card, Bid, GameState, GameOptions } from "../../../types/game";
import { createMessageId } from "../../../utils/protocol";
import { makeNameUnique } from "../../../utils/playerUtils";
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
  }, [isHost, dispatch]);

  const selectDealer = useCallback(() => {
    if (!isHost) return;

    dispatch({ type: "SELECT_DEALER" });
  }, [isHost, dispatch]);

  const drawDealerCard = useCallback((cardIndex?: number) => {
    if (gameState.dealerSelectionCards?.[myPlayerId]) return;

    if (isHost) {
      if (!gameState.deck) return;

      const availableCards = gameState.deck.filter(card =>
        !Object.values(gameState.dealerSelectionCards || {}).some(drawnCard =>
          drawnCard.id === card.id
        )
      );

      if (availableCards.length === 0) return;

      let drawnCard: Card;
      if (cardIndex !== undefined && cardIndex >= 0 && cardIndex < availableCards.length) {
        drawnCard = availableCards[cardIndex];
      } else {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        drawnCard = availableCards[randomIndex];
      }

      dispatch({
        type: "DRAW_DEALER_CARD",
        payload: { playerId: myPlayerId, card: drawnCard }
      });
    } else {
      if (cardIndex === undefined) return;

      networkService.sendMessage({
        type: "DRAW_DEALER_CARD",
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { cardIndex }
      });
    }
  }, [gameState, myPlayerId, isHost, dispatch, networkService]);

  const completeDealerSelection = useCallback(() => {
    if (!isHost || !gameState.dealerSelectionCards) return;

    const drawnCards = Object.keys(gameState.dealerSelectionCards).length;
    if (drawnCards !== gameState.players.length) return;

    dispatch({ type: "COMPLETE_DEALER_SELECTION" });
  }, [isHost, gameState.dealerSelectionCards, gameState.players.length, dispatch]);

  const proceedToDealing = useCallback(() => {
    if (!isHost) return;

    dispatch({ type: "PROCEED_TO_DEALING" });
  }, [isHost, dispatch]);

  const completeDealingAnimation = useCallback(() => {
    if (!isHost) return;

    dispatch({ type: "COMPLETE_DEALING_ANIMATION" });

    // Brief delay before dealing actual cards
    setTimeout(() => {
      dispatch({ type: "DEAL_CARDS" });
    }, 200);
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
      } else {
        networkService.sendMessage({
          type: "BID",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { bid },
        });
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
      } else {
        networkService.sendMessage({
          type: "PLAY_CARD",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { card },
        });
      }
    },
    [gameState.currentPlayerId, myPlayerId, isHost, dispatch, networkService]
  );

  const renamePlayer = useCallback(
    (playerId: string, newName: string): void => {
      if (!isHost && playerId !== myPlayerId) return;

      const uniqueName = makeNameUnique(newName, gameState.players, playerId);

      dispatch({
        type: "RENAME_PLAYER",
        payload: { playerId, newName: uniqueName }
      });

      if (playerId === myPlayerId) {
        networkService.sendMessage({
          type: "RENAME_PLAYER",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { newName: uniqueName }
        });
      }
    },
    [isHost, myPlayerId, dispatch, networkService, gameState.players]
  );

  const kickPlayer = useCallback(
    (playerId: string): void => {
      if (!isHost) return;

      dispatch({
        type: "KICK_PLAYER",
        payload: { playerId }
      });

      networkService.sendMessage({
        type: "KICK_PLAYER",
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId }
      });
    },
    [isHost, dispatch, networkService]
  );

  const movePlayer = useCallback(
    (playerId: string, newPosition: 0 | 1 | 2 | 3): void => {
      if (!isHost) return;

      dispatch({
        type: "MOVE_PLAYER",
        payload: { playerId, newPosition }
      });

      networkService.sendMessage({
        type: "MOVE_PLAYER",
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId, newPosition }
      });
    },
    [isHost, dispatch, networkService]
  );

  const dealerDiscard = useCallback(
    (card: Card) => {
      if (myPlayerId !== gameState.currentDealerId) return;

      if (isHost) {
        dispatch({
          type: "DEALER_DISCARD",
          payload: { card },
        });
      } else {
        networkService.sendMessage({
          type: "DEALER_DISCARD",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { card },
        });
      }
    },
    [myPlayerId, gameState.currentDealerId, isHost, dispatch, networkService]
  );

  const updateGameOptions = useCallback(
    (options: GameOptions) => {
      if (!isHost) return;
      if (gameState.phase !== 'lobby') return;

      dispatch({
        type: "UPDATE_GAME_OPTIONS",
        payload: { options }
      });
    },
    [isHost, gameState.phase, dispatch]
  );

  return {
    startGame,
    selectDealer,
    drawDealerCard,
    completeDealerSelection,
    proceedToDealing,
    completeDealingAnimation,
    placeBid,
    playCard,
    dealerDiscard,
    renamePlayer,
    kickPlayer,
    movePlayer,
    updateGameOptions,
  };
}
