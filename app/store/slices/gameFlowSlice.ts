import type { StateCreator } from 'zustand';
import type { Card, GameState, Player, PositionIndex } from '~/types/game';
import {
  createDeck,
  dealHands,
  findFirstBlackJackDealer,
  isFarmersHand,
  selectDealerAndTeams,
  selectDealerOnly,
} from '~/utils/game/gameLogic';
import {
  getNextDealerPosition,
  getNextPlayerPosition,
  getPositionFromPlayerId,
  getTeamId,
} from '~/utils/game/playerUtils';
import type { GameStore } from '../gameStore';

export interface GameFlowSlice {
  startGame: () => void;
  selectDealer: () => void;
  drawDealerCard: (playerId: string, card: Card) => void;
  dealerCardDealt: (playerId: string, card: Card, cardIndex: number, isBlackJack: boolean) => void;
  completeBlackjackDealerSelection: () => void;
  proceedToDealing: () => void;
  dealCards: () => void;
  nextHand: () => void;
}

export const createGameFlowSlice: StateCreator<GameStore, [], [], GameFlowSlice> = (set, get) => ({
  startGame: () => {
    const { players, options } = get();

    if (players.length !== 4) {
      return;
    }

    if (options.dealerSelection === 'predetermined_first_dealer') {
      if (options.predeterminedFirstDealerId === undefined) {
        return;
      }

      const dealer = players.find(p => p.id === options.predeterminedFirstDealerId);
      if (!dealer) {
        return;
      }

      const arrangedPlayers: Player[] = [];
      const dealerOriginalPosition = dealer.position;

      players.forEach(player => {
        const newPosition = ((player.position - dealerOriginalPosition + 4) % 4) as PositionIndex;
        arrangedPlayers[newPosition] = {
          ...player,
          position: newPosition,
          teamId: getTeamId(newPosition),
        };
      });

      const predeterminedDealerPosition = arrangedPlayers.find(
        p => p.id === options.predeterminedFirstDealerId
      )?.position;
      if (predeterminedDealerPosition === undefined) {
        return;
      }

      set({
        players: arrangedPlayers,
        currentDealerPosition: predeterminedDealerPosition,
        phase: 'team_summary',
        deck: createDeck(),
      });
      return;
    }

    set({ phase: 'dealer_selection' });
  },

  selectDealer: () => {
    const { options } = get();

    if (options.dealerSelection === 'predetermined_first_dealer') {
      if (options.predeterminedFirstDealerId === undefined) {
        return;
      }

      const dealer = get().players.find(p => p.id === options.predeterminedFirstDealerId);
      if (!dealer) {
        return;
      }

      set({
        currentDealerPosition: dealer.position,
        phase: 'team_summary',
        deck: createDeck(),
      });
      return;
    }

    const deck = createDeck();

    if (options.dealerSelection === 'first_black_jack') {
      set({
        deck,
        firstBlackJackDealing: {
          currentPlayerIndex: 0,
          currentCardIndex: 0,
          dealtCards: [],
        },
      });
    } else {
      set({
        deck,
        dealerSelectionCards: {} as Partial<Record<PositionIndex, Card>>,
      });
    }
  },

  drawDealerCard: (playerId: string, card: Card) => {
    const { dealerSelectionCards, players, options } = get();

    // Convert player ID to position for storing the card
    const playerPosition = getPositionFromPlayerId(playerId, players);
    if (playerPosition === undefined) return;

    const newDealerSelectionCards = {
      ...dealerSelectionCards,
      [playerPosition]: card,
    };

    if (Object.keys(newDealerSelectionCards).length === 4) {
      let dealer: Player;
      let arrangedPlayers: Player[];

      if (options.teamSelection === 'random_cards') {
        const result = selectDealerAndTeams(players, newDealerSelectionCards);
        dealer = result.dealer;
        arrangedPlayers = result.arrangedPlayers;
      } else {
        const result = selectDealerOnly(players, newDealerSelectionCards);
        dealer = result.dealer;
        arrangedPlayers = result.arrangedPlayers;
      }

      set({
        players: arrangedPlayers,
        currentDealerPosition: dealer.position,
        dealerSelectionCards: newDealerSelectionCards,
        phase: 'team_summary',
      });
    } else {
      set({ dealerSelectionCards: newDealerSelectionCards });
    }
  },

  dealerCardDealt: (playerId: string, card: Card, cardIndex: number, isBlackJack: boolean) => {
    const { firstBlackJackDealing, players } = get();

    // Convert player ID to position for the dealt card
    const playerPosition = getPositionFromPlayerId(playerId, players);
    if (playerPosition === undefined) return;

    const currentDealing = firstBlackJackDealing || {
      currentPlayerIndex: 0,
      currentCardIndex: 0,
      dealtCards: [],
    };

    const updatedDealing = {
      currentPlayerIndex: (currentDealing.currentPlayerIndex + 1) % players.length,
      currentCardIndex: cardIndex + 1,
      dealtCards: [...currentDealing.dealtCards, { playerPosition, card }],
      blackJackFound: isBlackJack ? { playerPosition, card } : currentDealing.blackJackFound,
    };

    set({ firstBlackJackDealing: updatedDealing });
  },

  completeBlackjackDealerSelection: () => {
    const { firstBlackJackDealing, deck, players } = get();

    if (!firstBlackJackDealing?.blackJackFound) {
      return;
    }

    const { dealer, arrangedPlayers } = findFirstBlackJackDealer(deck, players);

    set({
      players: arrangedPlayers,
      currentDealerPosition: dealer.position,
      phase: 'team_summary',
    });
  },

  proceedToDealing: () => {
    set({
      phase: 'dealing_animation',
      dealerSelectionCards: undefined,
    });
  },

  dealCards: () => {
    const { players, currentDealerPosition, options } = get();

    const deck = createDeck();
    const { hands, kitty, remainingDeck } = dealHands(deck);

    // Create position-based hands mapping
    const playerHands: Record<PositionIndex, Card[]> = {} as Record<PositionIndex, Card[]>;
    players.forEach((player, index) => {
      playerHands[player.position] = hands[index];
    });

    let nextPhase: GameState['phase'] = 'bidding_round1';
    let farmersHandPosition: PositionIndex | undefined = undefined;
    let currentPlayerPosition = getNextPlayerPosition(currentDealerPosition);

    if (options.farmersHand) {
      const playerWithFarmersHand = players.find(player => {
        const hand = playerHands[player.position];
        return hand && isFarmersHand(hand);
      });

      if (playerWithFarmersHand) {
        nextPhase = 'farmers_hand_swap';
        farmersHandPosition = playerWithFarmersHand.position;
        currentPlayerPosition = playerWithFarmersHand.position;
      }
    }

    set({
      deck: remainingDeck,
      hands: playerHands,
      kitty,
      phase: nextPhase,
      bids: [],
      currentPlayerPosition,
      trump: undefined,
      maker: undefined,
      turnedDownSuit: undefined,
      farmersHandPosition,
    });
  },

  nextHand: () => {
    const { currentDealerPosition } = get();

    set({
      phase: 'dealing_animation',
      currentDealerPosition: getNextDealerPosition(currentDealerPosition),
      completedTricks: [],
      trump: undefined,
      maker: undefined,
      bids: [],
      hands: {} as Record<PositionIndex, Card[]>,
      currentTrick: undefined,
      turnedDownSuit: undefined,
      handScores: { team0: 0, team1: 0 },
    });
  },
});
