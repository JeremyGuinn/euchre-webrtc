import { useCallback } from 'react';

import { createMessageId } from '~/network/protocol';
import { useGameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import type { Bid, Card, GameOptions, PositionIndex, TeamIndex } from '~/types/game';
import type { NetworkService } from '~/types/networkService';
import { getPositionFromPlayerId, makeNameUnique } from '~/utils/game/playerUtils';

export function useGameActions(networkService: NetworkService) {
  const gameStore = useGameStore();
  const myPlayer = useGameStore(select.myPlayer);

  const startGame = useCallback(() => {
    if (!myPlayer?.isHost) {
      return;
    }

    gameStore.startGame();

    // Broadcast the game start to all clients
    gameStore.players.forEach(player => {
      if (player.id !== gameStore.myPlayerId) {
        const personalizedState = gameStore.createPublicGameState(player.id);

        networkService.sendMessage(
          {
            type: 'START_GAME',
            timestamp: Date.now(),
            messageId: createMessageId(),
            payload: { gameState: personalizedState },
          },
          player.id
        );
      }
    });
  }, [myPlayer?.isHost, gameStore, networkService]);

  const selectDealer = useCallback(() => {
    if (!myPlayer?.isHost) {
      return;
    }

    gameStore.selectDealer();
  }, [myPlayer?.isHost, gameStore]);

  const dealFirstBlackJackCard = useCallback(() => {
    if (!myPlayer?.isHost) {
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
  }, [myPlayer?.isHost, gameStore, networkService]);

  const completeBlackJackDealerSelection = useCallback(() => {
    if (!myPlayer?.isHost) {
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
  }, [myPlayer?.isHost, networkService, gameStore]);

  const drawDealerCard = useCallback(
    (cardIndex?: number) => {
      const myPosition = getPositionFromPlayerId(gameStore.myPlayerId, gameStore.players);
      if (myPosition === undefined || gameStore.dealerSelectionCards?.[myPosition]) {
        return;
      }

      if (myPlayer?.isHost) {
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

        if (myPlayer?.id) gameStore.drawDealerCard(myPlayer.id, drawnCard);
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
    [gameStore, myPlayer?.id, myPlayer?.isHost, networkService]
  );

  const proceedToDealing = useCallback(() => {
    if (!myPlayer?.isHost) return;

    gameStore.proceedToDealing();
  }, [myPlayer?.isHost, gameStore]);

  const completeDealingAnimation = useCallback(() => {
    if (!myPlayer?.isHost) return;

    // Brief delay before dealing actual cards
    setTimeout(() => {
      gameStore.dealCards();
    }, 200);
  }, [myPlayer?.isHost, gameStore]);

  const placeBid = useCallback(
    (suit: Card['suit'] | 'pass', alone?: boolean) => {
      const myPlayer = gameStore.players.find(p => p.id === gameStore.myPlayerId);
      const myPosition = getPositionFromPlayerId(gameStore.myPlayerId, gameStore.players);
      if (!myPlayer || myPosition === undefined || gameStore.currentPlayerPosition !== myPosition) {
        return;
      }

      const bid: Bid = {
        playerPosition: myPosition,
        suit,
        alone,
      };

      if (myPlayer?.isHost) {
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
    [gameStore, networkService]
  );

  const playCard = useCallback(
    (card: Card) => {
      const myPosition = getPositionFromPlayerId(gameStore.myPlayerId, gameStore.players);
      if (myPosition === undefined || gameStore.currentPlayerPosition !== myPosition) {
        return;
      }

      if (myPlayer?.isHost) {
        gameStore.playCard(card, myPosition);
      } else {
        networkService.sendMessage({
          type: 'PLAY_CARD',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { card },
        });
      }
    },
    [gameStore, myPlayer?.isHost, networkService]
  );

  const renamePlayer = useCallback(
    (playerId: string, newName: string): void => {
      if (!myPlayer?.isHost && playerId !== gameStore.myPlayerId) {
        return;
      }

      const uniqueName = makeNameUnique(newName, gameStore.players, playerId);

      gameStore.renamePlayer(playerId, uniqueName);

      if (playerId === gameStore.myPlayerId) {
        networkService.sendMessage({
          type: 'RENAME_PLAYER',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { newName: uniqueName },
        });
      }
    },
    [myPlayer, gameStore, networkService]
  );

  const renameTeam = useCallback(
    (teamId: TeamIndex, newName: string): void => {
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
      if (!myPlayer?.isHost) {
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
    [myPlayer?.isHost, gameStore, networkService]
  );

  const movePlayer = useCallback(
    (playerId: string, newPosition: PositionIndex): void => {
      if (!myPlayer?.isHost) return;

      gameStore.movePlayer(playerId, newPosition);

      networkService.sendMessage({
        type: 'MOVE_PLAYER',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: { targetPlayerId: playerId, newPosition },
      });
    },
    [myPlayer?.isHost, gameStore, networkService]
  );

  const dealerDiscard = useCallback(
    (card: Card) => {
      const myPosition = getPositionFromPlayerId(gameStore.myPlayerId, gameStore.players);
      if (myPosition === undefined || myPosition !== gameStore.currentDealerPosition) return;

      if (myPlayer?.isHost) {
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
    [myPlayer, gameStore, networkService]
  );

  const updateGameOptions = useCallback(
    (options: GameOptions) => {
      if (!myPlayer?.isHost) return;
      if (gameStore.phase !== 'lobby') return;

      gameStore.updateGameOptions(options);
    },
    [myPlayer?.isHost, gameStore]
  );

  const setPredeterminedDealer = useCallback(
    (playerId: string) => {
      if (!myPlayer?.isHost) return;
      if (gameStore.phase !== 'lobby') return;
      if (gameStore.options.dealerSelection !== 'predetermined_first_dealer') return;

      // Validate the player exists
      const player = gameStore.players.find(p => p.id === playerId);
      if (!player) return;

      // Update the game options with the selected dealer position
      const updatedOptions: GameOptions = {
        ...gameStore.options,
        predeterminedFirstDealerId: player.id,
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
    [gameStore, myPlayer?.isHost, networkService]
  );

  const continueTrick = useCallback(() => {
    if (!myPlayer?.isHost) return;
    if (gameStore.phase !== 'trick_complete') return;

    gameStore.completeTrick();
  }, [myPlayer?.isHost, gameStore]);

  const completeHand = useCallback(() => {
    if (!myPlayer?.isHost) return;
    if (gameStore.phase !== 'hand_complete') return;

    gameStore.completeHand();
  }, [myPlayer?.isHost, gameStore]);

  const swapFarmersHand = useCallback(
    (cardsToSwap: Card[]) => {
      const myPlayer = gameStore.players.find(p => p.id === gameStore.myPlayerId);
      const myPosition = getPositionFromPlayerId(gameStore.myPlayerId, gameStore.players);
      if (!myPlayer || myPosition === undefined || gameStore.farmersHandPosition !== myPosition)
        return;

      if (myPlayer?.isHost) {
        gameStore.farmersHandSwap(myPosition, cardsToSwap);
      } else {
        networkService.sendMessage({
          type: 'FARMERS_HAND_SWAP',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { cardsToSwap },
        });
      }
    },
    [gameStore, networkService]
  );

  const declineFarmersHand = useCallback(() => {
    const myPlayer = gameStore.players.find(p => p.id === gameStore.myPlayerId);
    const myPosition = getPositionFromPlayerId(gameStore.myPlayerId, gameStore.players);
    if (!myPlayer || myPosition === undefined || gameStore.farmersHandPosition !== myPosition)
      return;

    if (myPlayer?.isHost) {
      gameStore.farmersHandDeclined(myPosition);
    } else {
      networkService.sendMessage({
        type: 'FARMERS_HAND_DECLINE',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {},
      });
    }
  }, [gameStore, networkService]);

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
