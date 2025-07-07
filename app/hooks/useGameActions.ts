import { useCallback } from 'react';

import { createScopedLogger } from '~/services/loggingService';
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
  const logger = createScopedLogger('useGameActions', {
    myPlayerId,
    isHost,
    gamePhase: gameState.phase,
  });
  const startGame = useCallback(() => {
    logger.trace('Attempting to start game');

    if (!isHost) {
      logger.warn('Non-host attempted to start game');
      return;
    }

    logger.info('Starting game', {
      playerCount: gameState.players.length,
      gameOptions: gameState.options,
    });

    dispatch({ type: 'START_GAME' });
    logger.debug('Game start action dispatched');
  }, [isHost, dispatch, logger, gameState.players.length, gameState.options]);

  const selectDealer = useCallback(() => {
    logger.trace('Attempting to select dealer');

    if (!isHost) {
      logger.warn('Non-host attempted to select dealer');
      return;
    }

    logger.debug('Selecting dealer', {
      dealerSelection: gameState.options.dealerSelection,
    });

    dispatch({ type: 'SELECT_DEALER' });
    logger.debug('Dealer selection action dispatched');
  }, [isHost, dispatch, logger, gameState.options.dealerSelection]);

  const dealFirstBlackJackCard = useCallback(() => {
    logger.trace('Attempting to deal first black jack card');

    if (!isHost) {
      logger.warn('Non-host attempted to deal first black jack card');
      return;
    }
    if (gameState.options.dealerSelection !== 'first_black_jack') {
      logger.trace(
        'Skipping black jack dealing - not in first_black_jack mode'
      );
      return;
    }
    if (!gameState.firstBlackJackDealing) {
      logger.trace('Skipping black jack dealing - no dealing state');
      return;
    }
    if (!gameState.deck) {
      logger.warn('No deck available for dealing');
      return;
    }

    const { currentPlayerIndex, currentCardIndex } =
      gameState.firstBlackJackDealing;

    if (currentCardIndex >= gameState.deck.length) {
      logger.error('Attempted to deal beyond deck length', {
        currentCardIndex,
        deckLength: gameState.deck.length,
      });
      return;
    }

    const currentPlayer = gameState.players[currentPlayerIndex];
    const card = gameState.deck[currentCardIndex];
    const isBlackJack =
      card.value === 'J' && (card.suit === 'spades' || card.suit === 'clubs');

    logger.trace('Dealing card to player', {
      currentPlayerIndex,
      currentCardIndex,
      playerName: currentPlayer.name,
      card: `${card.value} of ${card.suit}`,
      isBlackJack,
    });

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

    if (isBlackJack) {
      logger.info('Black jack dealt - dealer selected', {
        dealerName: currentPlayer.name,
        card: `${card.value} of ${card.suit}`,
      });
    } else {
      logger.debug('Card dealt, continuing to next player', {
        card: `${card.value} of ${card.suit}`,
        nextPlayerIndex: (currentPlayerIndex + 1) % gameState.players.length,
      });
    }
  }, [isHost, gameState, networkService, dispatch, logger]);

  const completeBlackJackDealerSelection = useCallback(() => {
    logger.trace('Attempting to complete black jack dealer selection');

    if (!isHost) {
      logger.warn('Non-host attempted to complete black jack dealer selection');
      return;
    }

    logger.info('Completing black jack dealer selection');

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

    logger.debug('Black jack dealer selection completed');
  }, [isHost, networkService, dispatch, logger]);

  const drawDealerCard = useCallback(
    (cardIndex?: number) => {
      logger.trace('Attempting to draw dealer card', { cardIndex });

      if (gameState.dealerSelectionCards?.[myPlayerId]) {
        logger.debug('Player already has dealer card, skipping');
        return;
      }

      if (isHost) {
        if (!gameState.deck) {
          logger.warn('No deck available for dealer card selection');
          return;
        }

        const availableCards = gameState.deck.filter(
          card =>
            !Object.values(gameState.dealerSelectionCards || {}).some(
              drawnCard => drawnCard.id === card.id
            )
        );

        if (availableCards.length === 0) {
          logger.warn('No available cards for dealer selection');
          return;
        }

        let drawnCard: Card;
        if (
          cardIndex !== undefined &&
          cardIndex >= 0 &&
          cardIndex < availableCards.length
        ) {
          drawnCard = availableCards[cardIndex];
          logger.debug('Drawing specific card by index', { cardIndex });
        } else {
          const randomIndex = Math.floor(Math.random() * availableCards.length);
          drawnCard = availableCards[randomIndex];
          logger.debug('Drawing random card', { randomIndex });
        }

        logger.info('Player drew dealer card', {
          playerName: gameState.players.find(p => p.id === myPlayerId)?.name,
          card: `${drawnCard.value} of ${drawnCard.suit}`,
        });

        dispatch({
          type: 'DRAW_DEALER_CARD',
          payload: { playerId: myPlayerId, card: drawnCard },
        });
      } else {
        if (cardIndex === undefined) {
          logger.warn('Client attempted to draw random card - not allowed');
          return;
        }

        logger.debug('Sending dealer card draw request to host', { cardIndex });
        networkService.sendMessage({
          type: 'DRAW_DEALER_CARD',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { cardIndex },
        });
      }
    },
    [gameState, myPlayerId, isHost, dispatch, networkService, logger]
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
      logger.trace('Attempting to place bid', { suit, alone });

      const myPlayer = gameState.players.find(p => p.id === myPlayerId);
      if (!myPlayer || gameState.currentPlayerId !== myPlayerId) {
        logger.warn('Invalid bid attempt', {
          playerExists: !!myPlayer,
          isMyTurn: gameState.currentPlayerId === myPlayerId,
          currentPlayerId: gameState.currentPlayerId,
        });
        return;
      }

      const bid: Bid = {
        playerId: myPlayerId,
        suit,
        alone,
      };

      logger.info('Placing bid', {
        playerName: myPlayer.name,
        suit,
        alone: !!alone,
        isHost,
      });

      if (isHost) {
        dispatch({ type: 'PLACE_BID', payload: { bid } });
        logger.debug('Bid action dispatched locally');
      } else {
        networkService.sendMessage({
          type: 'BID',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { bid },
        });
        logger.debug('Bid message sent to host');
      }
    },
    [
      gameState.players,
      gameState.currentPlayerId,
      myPlayerId,
      isHost,
      dispatch,
      networkService,
      logger,
    ]
  );

  const playCard = useCallback(
    (card: Card) => {
      logger.trace('Attempting to play card', {
        card: `${card.value} of ${card.suit}`,
      });

      if (gameState.currentPlayerId !== myPlayerId) {
        logger.warn('Attempted to play card out of turn', {
          currentPlayerId: gameState.currentPlayerId,
          cardPlayed: `${card.value} of ${card.suit}`,
        });
        return;
      }

      logger.info('Playing card', {
        card: `${card.value} of ${card.suit}`,
        trickNumber: gameState.completedTricks.length + 1,
      });

      if (isHost) {
        dispatch({
          type: 'PLAY_CARD',
          payload: { card, playerId: myPlayerId },
        });
        logger.debug('Card play action dispatched locally', {
          currentTrickCards: gameState.currentTrick?.cards.length || 0,
        });
      } else {
        networkService.sendMessage({
          type: 'PLAY_CARD',
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { card },
        });
        logger.debug('Card play message sent to host');
      }
    },
    [
      gameState.currentPlayerId,
      gameState.completedTricks.length,
      gameState.currentTrick?.cards.length,
      myPlayerId,
      isHost,
      dispatch,
      networkService,
      logger,
    ]
  );

  const renamePlayer = useCallback(
    (playerId: string, newName: string): void => {
      logger.trace('Attempting to rename player', { playerId, newName });

      if (!isHost && playerId !== myPlayerId) {
        logger.warn('Non-host attempted to rename other player', { playerId });
        return;
      }

      const uniqueName = makeNameUnique(newName, gameState.players, playerId);
      const targetPlayer = gameState.players.find(p => p.id === playerId);

      logger.info('Player renamed', {
        playerName: targetPlayer?.name || 'Unknown',
        oldName: targetPlayer?.name,
        newName: uniqueName,
        wasModified: uniqueName !== newName,
      });

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
        logger.debug('Rename message sent to other players');
      }
    },
    [isHost, myPlayerId, dispatch, networkService, gameState.players, logger]
  );

  const renameTeam = useCallback(
    (teamId: 0 | 1, newName: string): void => {
      logger.trace('Attempting to rename team', { teamId, newName });

      // Only allow team renaming during specific phases
      const allowedPhases = ['lobby', 'team_summary'];
      if (!allowedPhases.includes(gameState.phase)) {
        logger.warn('Team rename attempted in invalid phase', {
          currentPhase: gameState.phase,
          allowedPhases,
        });
        return;
      }

      // Validate team name
      const sanitizedName = newName.trim();
      if (!sanitizedName || sanitizedName.length > 50) {
        logger.warn('Invalid team name provided', {
          newName,
          sanitizedName,
          length: sanitizedName.length,
        });
        return;
      }

      logger.info('Team renamed', {
        teamId,
        oldName:
          gameState.teamNames[
            `team${teamId}` as keyof typeof gameState.teamNames
          ],
        newName: sanitizedName,
      });

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

      logger.debug('Team rename message sent to other players');
    },
    [dispatch, networkService, gameState, logger]
  );

  const kickPlayer = useCallback(
    (playerId: string): void => {
      if (!isHost) {
        logger.warn('Non-host attempted to kick player', {
          targetPlayerId: playerId,
        });
        return;
      }

      const targetPlayer = gameState.players.find(p => p.id === playerId);
      logger.warn('Kicking player from game', {
        targetPlayerId: playerId,
        targetPlayerName: targetPlayer?.name || 'Unknown',
        remainingPlayers: gameState.players.length - 1,
      });

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
    [isHost, gameState.players, dispatch, networkService, logger]
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
