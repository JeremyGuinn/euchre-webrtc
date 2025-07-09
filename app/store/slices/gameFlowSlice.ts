import type { StateCreator } from 'zustand';
import type { Card, GameState, Player } from '~/types/game';
import {
  createDeck,
  dealHands,
  findFirstBlackJackDealer,
  isFarmersHand,
  selectDealerAndTeams,
  selectDealerOnly,
} from '~/utils/gameLogic';
import { getNextDealer, getNextPlayer, getTeamId } from '~/utils/playerUtils';
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
      const predeterminedDealerId = options.predeterminedFirstDealerId;

      if (!predeterminedDealerId) {
        return;
      }

      const dealer = players.find(p => p.id === predeterminedDealerId);
      if (!dealer) {
        return;
      }

      const arrangedPlayers: Player[] = [];
      const dealerOriginalPosition = dealer.position;

      players.forEach(player => {
        const newPosition = ((player.position - dealerOriginalPosition + 4) % 4) as 0 | 1 | 2 | 3;
        arrangedPlayers[newPosition] = {
          ...player,
          position: newPosition,
          teamId: getTeamId(newPosition),
        };
      });

      set({
        players: arrangedPlayers,
        currentDealerId: predeterminedDealerId,
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
      const predeterminedDealerId = options.predeterminedFirstDealerId;

      if (!predeterminedDealerId) {
        return;
      }

      const dealer = get().players.find(p => p.id === predeterminedDealerId);
      if (!dealer) {
        return;
      }

      set({
        currentDealerId: predeterminedDealerId,
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
        dealerSelectionCards: {},
      });
    }
  },

  drawDealerCard: (playerId: string, card: Card) => {
    const { dealerSelectionCards, players, options } = get();

    const newDealerSelectionCards = {
      ...dealerSelectionCards,
      [playerId]: card,
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
        currentDealerId: dealer.id,
        dealerSelectionCards: newDealerSelectionCards,
        phase: 'team_summary',
      });
    } else {
      set({ dealerSelectionCards: newDealerSelectionCards });
    }
  },

  dealerCardDealt: (playerId: string, card: Card, cardIndex: number, isBlackJack: boolean) => {
    const { firstBlackJackDealing, players } = get();

    const currentDealing = firstBlackJackDealing || {
      currentPlayerIndex: 0,
      currentCardIndex: 0,
      dealtCards: [],
    };

    const updatedDealing = {
      currentPlayerIndex: (currentDealing.currentPlayerIndex + 1) % players.length,
      currentCardIndex: cardIndex + 1,
      dealtCards: [...currentDealing.dealtCards, { playerId, card }],
      blackJackFound: isBlackJack ? { playerId, card } : currentDealing.blackJackFound,
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
      currentDealerId: dealer.id,
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
    const { players, currentDealerId, options } = get();

    const deck = createDeck();
    const { hands, kitty, remainingDeck } = dealHands(deck);

    const playerHands: Record<string, Card[]> = {};
    players.forEach((player, index) => {
      playerHands[player.id] = hands[index];
    });

    let nextPhase: GameState['phase'] = 'bidding_round1';
    let farmersHandPlayer: string | undefined = undefined;
    let currentPlayerId = getNextPlayer(currentDealerId, players);

    if (options.farmersHand) {
      const playerWithFarmersHand = players.find(player => {
        const hand = playerHands[player.id];
        return hand && isFarmersHand(hand);
      });

      if (playerWithFarmersHand) {
        nextPhase = 'farmers_hand_swap';
        farmersHandPlayer = playerWithFarmersHand.id;
        currentPlayerId = playerWithFarmersHand.id;
      }
    }

    set({
      deck: remainingDeck,
      hands: playerHands,
      kitty,
      phase: nextPhase,
      bids: [],
      currentPlayerId,
      trump: undefined,
      maker: undefined,
      turnedDownSuit: undefined,
      farmersHandPlayer,
    });
  },

  nextHand: () => {
    const { currentDealerId, players } = get();

    set({
      phase: 'dealing_animation',
      currentDealerId: getNextDealer(currentDealerId, players),
      completedTricks: [],
      trump: undefined,
      maker: undefined,
      bids: [],
      hands: {},
      currentTrick: undefined,
      turnedDownSuit: undefined,
      handScores: { team0: 0, team1: 0 },
    });
  },
});
