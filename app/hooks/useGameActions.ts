import { useCallback } from 'react';

import { GameNetworkService } from '~/services/networkService';
import type { Bid, Card, GameOptions, GameState } from '~/types/game';
import type { GameAction } from '~/utils/gameState';
import { makeNameUnique } from '~/utils/playerUtils';
import { createMessageId } from '~/utils/protocol';

export function useGameActions(
  gameState: GameState,
  myPlayerId: string,
  isHost: boolean,
  dispatch: React.Dispatch<GameAction>,
  networkService: GameNetworkService
) {
  const startGame = useCallback(() => {
    if (!isHost) {
      return;
    }

    dispatch({ type: 'START_GAME' });
  }, [isHost, dispatch]);

  const selectDealer = useCallback(() => {
    if (!isHost) {
      return;
    }

    dispatch({ type: 'SELECT_DEALER' });
  }, [isHost, dispatch]);

  const dealFirstBlackJackCard = useCallback(() => {
    if (!isHost) {
      return;
    }
    if (gameState.options.dealerSelection !== 'first_black_jack') {
      return;
    }
    if (!gameState.firstBlackJackDealing) {
      return;
    }
    if (!gameState.deck) {
      return;
    }

    const { currentPlayerIndex, currentCardIndex } =
      gameState.firstBlackJackDealing;

    if (currentCardIndex >= gameState.deck.length) {
      return;
    }

    const currentPlayer = gameState.players[currentPlayerIndex];
    const card = gameState.deck[currentCardIndex];
    const isBlackJack =
      card.value === 'J' && (card.suit === 'spades' || card.suit === 'clubs');

    // Broadcast the dealt card to all clients
    networkService.sendMessage({
      type: 'DEALER_CARD_DEALT',
      timestamp: Date.now(),
      messageId: createMessageId(),
      payload: {
        playerId: currentPlayer.id,
        card,
        cardIndex: currentCardIndex,
        isBlackJack,
      },
    });

    // Update local state
    dispatch({
      type: 'DEALER_CARD_DEALT',
      payload: {
        playerId: currentPlayer.id,
        card,
        cardIndex: currentCardIndex,
        isBlackJack,
      },
    });
  }, [isHost, gameState, networkService, dispatch]);

  const completeBlackJackDealerSelection = useCallback(() => {
    if (!isHost) {
      return;
    }

    // Broadcast the completion to all clients
    networkService.sendMessage({
      type: 'COMPLETE_BLACKJACK_DEALER_SELECTION',
      timestamp: Date.now(),
      messageId: createMessageId(),
      payload: {},
    });

    // Update local state
    dispatch({
      type: 'COMPLETE_BLACKJACK_DEALER_SELECTION',
    });
  }, [isHost, networkService, dispatch]);

  const drawDealerCard = useCallback(
    (cardIndex?: number) => {
      if (gameState.dealerSelectionCards?.[myPlayerId]) {
        return;
      }

      if (isHost) {
        if (!gameState.deck) {
          return;
        }

        const availableCards = gameState.deck.filter(
          card =>
            !Object.values(gameState.dealerSelectionCards || {}).some(
              drawnCard => drawnCard.id === card.id
            )
        );

        if (availableCards.length === 0) {
          return;
        }

        let drawnCard: Card;
        if (
          cardIndex !== undefined &&
          cardIndex >= 0 &&
          cardIndex < availableCards.length
        ) {
          drawnCard = availableCards[cardIndex];
        } else {
          const randomIndex = Math.floor(Math.random() * availableCards.length);
          drawnCard = availableCards[randomIndex];
        }

        dispatch({
          type: 'DRAW_DEALER_CARD',
          payload: { playerId: myPlayerId, card: drawnCard },
        });
      } else {
        if (cardIndex === undefined) {
          return;
        }

        networkService.sendMessage({
          type: 'DRAW_DEALER_CARD',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { cardIndex },
        });
      }
    },
    [gameState, myPlayerId, isHost, dispatch, networkService]
  );

  const proceedToDealing = useCallback(() => {
    if (!isHost) return;

    dispatch({ type: 'PROCEED_TO_DEALING' });
  }, [isHost, dispatch]);

  const completeDealingAnimation = useCallback(() => {
    if (!isHost) return;

    // Brief delay before dealing actual cards
    setTimeout(() => {
      dispatch({ type: 'DEAL_CARDS' });
    }, 200);
  }, [isHost, dispatch]);

  const placeBid = useCallback(
    (suit: Card['suit'] | 'pass', alone?: boolean) => {
      const myPlayer = gameState.players.find(p => p.id === myPlayerId);
      if (!myPlayer || gameState.currentPlayerId !== myPlayerId) {
        return;
      }

      const bid: Bid = {
        playerId: myPlayerId,
        suit,
        alone,
      };

      if (isHost) {
        dispatch({ type: 'PLACE_BID', payload: { bid } });
      } else {
        networkService.sendMessage({
          type: 'BID',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { bid },
        });
      }
    },
    [
      gameState.players,
      gameState.currentPlayerId,
      myPlayerId,
      isHost,
      dispatch,
      networkService,
    ]
  );

  const playCard = useCallback(
    (card: Card) => {
      if (gameState.currentPlayerId !== myPlayerId) {
        return;
      }

      if (isHost) {
        dispatch({
          type: 'PLAY_CARD',
          payload: { card, playerId: myPlayerId },
        });
      } else {
        networkService.sendMessage({
          type: 'PLAY_CARD',
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
      if (!isHost && playerId !== myPlayerId) {
        return;
      }

      const uniqueName = makeNameUnique(newName, gameState.players, playerId);

      dispatch({
        type: 'RENAME_PLAYER',
        payload: { playerId, newName: uniqueName },
      });

      if (playerId === myPlayerId) {
        networkService.sendMessage({
          type: 'RENAME_PLAYER',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { newName: uniqueName },
        });
      }
    },
    [isHost, myPlayerId, dispatch, networkService, gameState.players]
  );

  const renameTeam = useCallback(
    (teamId: 0 | 1, newName: string): void => {
      // Only allow team renaming during specific phases
      const allowedPhases = ['lobby', 'team_summary'];
      if (!allowedPhases.includes(gameState.phase)) {
        return;
      }

      // Validate team name
      const sanitizedName = newName.trim();
      if (!sanitizedName || sanitizedName.length > 50) {
        return;
      }

      dispatch({
        type: 'RENAME_TEAM',
        payload: { teamId, newName: sanitizedName },
      });

      networkService.sendMessage({
        type: 'RENAME_TEAM',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { teamId, newName: sanitizedName },
      });
    },
    [dispatch, networkService, gameState]
  );

  const kickPlayer = useCallback(
    (playerId: string): void => {
      if (!isHost) {
        return;
      }

      dispatch({
        type: 'KICK_PLAYER',
        payload: { playerId },
      });

      networkService.sendMessage({
        type: 'KICK_PLAYER',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId },
      });
    },
    [isHost, dispatch, networkService]
  );

  const movePlayer = useCallback(
    (playerId: string, newPosition: 0 | 1 | 2 | 3): void => {
      if (!isHost) return;

      dispatch({
        type: 'MOVE_PLAYER',
        payload: { playerId, newPosition },
      });

      networkService.sendMessage({
        type: 'MOVE_PLAYER',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId, newPosition },
      });
    },
    [isHost, dispatch, networkService]
  );

  const dealerDiscard = useCallback(
    (card: Card) => {
      if (myPlayerId !== gameState.currentDealerId) return;

      if (isHost) {
        dispatch({
          type: 'DEALER_DISCARD',
          payload: { card },
        });
      } else {
        networkService.sendMessage({
          type: 'DEALER_DISCARD',
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
        type: 'UPDATE_GAME_OPTIONS',
        payload: { options },
      });
    },
    [isHost, gameState.phase, dispatch]
  );

  const setPredeterminedDealer = useCallback(
    (playerId: string) => {
      if (!isHost) return;
      if (gameState.phase !== 'lobby') return;
      if (gameState.options.dealerSelection !== 'predetermined_first_dealer')
        return;

      // Validate the player exists
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return;

      // Update the game options with the selected dealer
      const updatedOptions: GameOptions = {
        ...gameState.options,
        predeterminedFirstDealerId: playerId,
      };

      dispatch({
        type: 'UPDATE_GAME_OPTIONS',
        payload: { options: updatedOptions },
      });

      // Optionally send a message to all clients about the dealer selection
      if (networkService) {
        networkService.sendMessage({
          type: 'SET_PREDETERMINED_DEALER',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { dealerId: playerId },
        });
      }
    },
    [
      isHost,
      gameState.phase,
      gameState.options,
      gameState.players,
      dispatch,
      networkService,
    ]
  );

  const continueTrick = useCallback(() => {
    if (!isHost) return;
    if (gameState.phase !== 'trick_complete') return;

    dispatch({ type: 'COMPLETE_TRICK' });
  }, [isHost, gameState.phase, dispatch]);

  const completeHand = useCallback(() => {
    if (!isHost) return;
    if (gameState.phase !== 'hand_complete') return;

    dispatch({ type: 'COMPLETE_HAND' });
  }, [isHost, gameState.phase, dispatch]);

  const swapFarmersHand = useCallback(
    (cardsToSwap: Card[]) => {
      const myPlayer = gameState.players.find(p => p.id === myPlayerId);
      if (!myPlayer || gameState.farmersHandPlayer !== myPlayerId) return;

      if (isHost) {
        dispatch({
          type: 'FARMERS_HAND_SWAP',
          payload: { playerId: myPlayerId, cardsToSwap },
        });
      } else {
        networkService.sendMessage({
          type: 'FARMERS_HAND_SWAP',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { cardsToSwap },
        });
      }
    },
    [
      gameState.players,
      gameState.farmersHandPlayer,
      myPlayerId,
      isHost,
      dispatch,
      networkService,
    ]
  );

  const declineFarmersHand = useCallback(() => {
    const myPlayer = gameState.players.find(p => p.id === myPlayerId);
    if (!myPlayer || gameState.farmersHandPlayer !== myPlayerId) return;

    if (isHost) {
      dispatch({
        type: 'FARMERS_HAND_DECLINED',
        payload: { playerId: myPlayerId },
      });
    } else {
      networkService.sendMessage({
        type: 'FARMERS_HAND_DECLINE',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {},
      });
    }
  }, [
    gameState.players,
    gameState.farmersHandPlayer,
    myPlayerId,
    isHost,
    dispatch,
    networkService,
  ]);

  return {
    startGame,
    selectDealer,
    dealFirstBlackJackCard,
    completeBlackJackDealerSelection,
    drawDealerCard,
    proceedToDealing,
    completeDealingAnimation,
    placeBid,
    playCard,
    dealerDiscard,
    renamePlayer,
    renameTeam,
    kickPlayer,
    movePlayer,
    updateGameOptions,
    setPredeterminedDealer,
    continueTrick,
    completeHand,
    swapFarmersHand,
    declineFarmersHand,
  };
}
