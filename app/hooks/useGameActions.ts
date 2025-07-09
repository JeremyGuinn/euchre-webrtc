import { useCallback } from 'react';

import { GameNetworkService } from '~/services/networkService';
import { useGameStore } from '~/store/gameStore';
import type { Bid, Card, GameOptions } from '~/types/game';
import { makeNameUnique } from '~/utils/playerUtils';
import { createMessageId } from '~/utils/protocol';

export function useGameActions(
  myPlayerId: string,
  isHost: boolean,
  networkService: GameNetworkService
) {
  const gameStore = useGameStore();
  const startGame = useCallback(() => {
    if (!isHost) {
      return;
    }

    gameStore.startGame();
  }, [isHost, gameStore]);

  const selectDealer = useCallback(() => {
    if (!isHost) {
      return;
    }

    gameStore.selectDealer();
  }, [isHost, gameStore]);

  const dealFirstBlackJackCard = useCallback(() => {
    if (!isHost) {
      return;
    }
    if (gameStore.options.dealerSelection !== 'first_black_jack') {
      return;
    }
    if (!gameStore.firstBlackJackDealing) {
      return;
    }
    if (!gameStore.deck) {
      return;
    }

    const { currentPlayerIndex, currentCardIndex } = gameStore.firstBlackJackDealing;

    if (currentCardIndex >= gameStore.deck.length) {
      return;
    }

    const currentPlayer = gameStore.players[currentPlayerIndex];
    const card = gameStore.deck[currentCardIndex];
    const isBlackJack = card.value === 'J' && (card.suit === 'spades' || card.suit === 'clubs');

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
    gameStore.dealerCardDealt(currentPlayer.id, card, currentCardIndex, isBlackJack);
  }, [isHost, gameStore, networkService]);

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
    gameStore.completeBlackjackDealerSelection();
  }, [isHost, networkService, gameStore]);

  const drawDealerCard = useCallback(
    (cardIndex?: number) => {
      if (gameStore.dealerSelectionCards?.[myPlayerId]) {
        return;
      }

      if (isHost) {
        if (!gameStore.deck) {
          return;
        }

        const availableCards = gameStore.deck.filter(
          card =>
            !Object.values(gameStore.dealerSelectionCards || {}).some(
              drawnCard => drawnCard.id === card.id
            )
        );

        if (availableCards.length === 0) {
          return;
        }

        let drawnCard: Card;
        if (cardIndex !== undefined && cardIndex >= 0 && cardIndex < availableCards.length) {
          drawnCard = availableCards[cardIndex];
        } else {
          const randomIndex = Math.floor(Math.random() * availableCards.length);
          drawnCard = availableCards[randomIndex];
        }

        gameStore.drawDealerCard(myPlayerId, drawnCard);
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
    [gameStore, myPlayerId, isHost, networkService]
  );

  const proceedToDealing = useCallback(() => {
    if (!isHost) return;

    gameStore.proceedToDealing();
  }, [isHost, gameStore]);

  const completeDealingAnimation = useCallback(() => {
    if (!isHost) return;

    // Brief delay before dealing actual cards
    setTimeout(() => {
      gameStore.dealCards();
    }, 200);
  }, [isHost, gameStore]);

  const placeBid = useCallback(
    (suit: Card['suit'] | 'pass', alone?: boolean) => {
      const myPlayer = gameStore.players.find(p => p.id === myPlayerId);
      if (!myPlayer || gameStore.currentPlayerId !== myPlayerId) {
        return;
      }

      const bid: Bid = {
        playerId: myPlayerId,
        suit,
        alone,
      };

      if (isHost) {
        gameStore.placeBid(bid);
      } else {
        networkService.sendMessage({
          type: 'BID',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { bid },
        });
      }
    },
    [gameStore.players, gameStore.currentPlayerId, myPlayerId, isHost, gameStore, networkService]
  );

  const playCard = useCallback(
    (card: Card) => {
      if (gameStore.currentPlayerId !== myPlayerId) {
        return;
      }

      if (isHost) {
        gameStore.playCard(card, myPlayerId);
      } else {
        networkService.sendMessage({
          type: 'PLAY_CARD',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { card },
        });
      }
    },
    [gameStore.currentPlayerId, myPlayerId, isHost, gameStore, networkService]
  );

  const renamePlayer = useCallback(
    (playerId: string, newName: string): void => {
      if (!isHost && playerId !== myPlayerId) {
        return;
      }

      const uniqueName = makeNameUnique(newName, gameStore.players, playerId);

      gameStore.renamePlayer(playerId, uniqueName);

      if (playerId === myPlayerId) {
        networkService.sendMessage({
          type: 'RENAME_PLAYER',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { newName: uniqueName },
        });
      }
    },
    [isHost, myPlayerId, gameStore, networkService]
  );

  const renameTeam = useCallback(
    (teamId: 0 | 1, newName: string): void => {
      // Only allow team renaming during specific phases
      const allowedPhases = ['lobby', 'team_summary'];
      if (!allowedPhases.includes(gameStore.phase)) {
        return;
      }

      // Validate team name
      const sanitizedName = newName.trim();
      if (!sanitizedName || sanitizedName.length > 50) {
        return;
      }

      gameStore.renameTeam(teamId, sanitizedName);

      networkService.sendMessage({
        type: 'RENAME_TEAM',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { teamId, newName: sanitizedName },
      });
    },
    [gameStore, networkService]
  );

  const kickPlayer = useCallback(
    (playerId: string): void => {
      if (!isHost) {
        return;
      }

      gameStore.kickPlayer(playerId);

      networkService.sendMessage({
        type: 'KICK_PLAYER',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId },
      });
    },
    [isHost, gameStore, networkService]
  );

  const movePlayer = useCallback(
    (playerId: string, newPosition: 0 | 1 | 2 | 3): void => {
      if (!isHost) return;

      gameStore.movePlayer(playerId, newPosition);

      networkService.sendMessage({
        type: 'MOVE_PLAYER',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId, newPosition },
      });
    },
    [isHost, gameStore, networkService]
  );

  const dealerDiscard = useCallback(
    (card: Card) => {
      if (myPlayerId !== gameStore.currentDealerId) return;

      if (isHost) {
        gameStore.dealerDiscard(card);
      } else {
        networkService.sendMessage({
          type: 'DEALER_DISCARD',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { card },
        });
      }
    },
    [myPlayerId, gameStore.currentDealerId, isHost, gameStore, networkService]
  );

  const updateGameOptions = useCallback(
    (options: GameOptions) => {
      if (!isHost) return;
      if (gameStore.phase !== 'lobby') return;

      gameStore.updateGameOptions(options);
    },
    [isHost, gameStore.phase, gameStore]
  );

  const setPredeterminedDealer = useCallback(
    (playerId: string) => {
      if (!isHost) return;
      if (gameStore.phase !== 'lobby') return;
      if (gameStore.options.dealerSelection !== 'predetermined_first_dealer') return;

      // Validate the player exists
      const player = gameStore.players.find(p => p.id === playerId);
      if (!player) return;

      // Update the game options with the selected dealer
      const updatedOptions: GameOptions = {
        ...gameStore.options,
        predeterminedFirstDealerId: playerId,
      };

      gameStore.updateGameOptions(updatedOptions);

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
    [isHost, gameStore.phase, gameStore.options, gameStore.players, gameStore, networkService]
  );

  const continueTrick = useCallback(() => {
    if (!isHost) return;
    if (gameStore.phase !== 'trick_complete') return;

    gameStore.completeTrick();
  }, [isHost, gameStore.phase, gameStore]);

  const completeHand = useCallback(() => {
    if (!isHost) return;
    if (gameStore.phase !== 'hand_complete') return;

    gameStore.completeHand();
  }, [isHost, gameStore.phase, gameStore]);

  const swapFarmersHand = useCallback(
    (cardsToSwap: Card[]) => {
      const myPlayer = gameStore.players.find(p => p.id === myPlayerId);
      if (!myPlayer || gameStore.farmersHandPlayer !== myPlayerId) return;

      if (isHost) {
        gameStore.farmersHandSwap(myPlayerId, cardsToSwap);
      } else {
        networkService.sendMessage({
          type: 'FARMERS_HAND_SWAP',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { cardsToSwap },
        });
      }
    },
    [gameStore.players, gameStore.farmersHandPlayer, myPlayerId, isHost, gameStore, networkService]
  );

  const declineFarmersHand = useCallback(() => {
    const myPlayer = gameStore.players.find(p => p.id === myPlayerId);
    if (!myPlayer || gameStore.farmersHandPlayer !== myPlayerId) return;

    if (isHost) {
      gameStore.farmersHandDeclined(myPlayerId);
    } else {
      networkService.sendMessage({
        type: 'FARMERS_HAND_DECLINE',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {},
      });
    }
  }, [
    gameStore.players,
    gameStore.farmersHandPlayer,
    myPlayerId,
    isHost,
    gameStore,
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
