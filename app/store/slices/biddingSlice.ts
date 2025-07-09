import type { StateCreator } from 'zustand';
import type { Bid, Card } from '~/types/game';
import { getNextDealer, getNextPlayerWithAlone } from '~/utils/playerUtils';
import type { GameStore } from '../gameStore';

export interface BiddingSlice {
  placeBid: (bid: Bid) => void;
  dealerDiscard: (card: Card) => void;
  setTrump: (trump: Card['suit'], makerId: string, alone?: boolean) => void;
}

export const createBiddingSlice: StateCreator<GameStore, [], [], BiddingSlice> = (set, get) => ({
  placeBid: (bid: Bid) => {
    const state = get();
    const newBids = [...state.bids, bid];

    let newPhase = state.phase;
    let trump = state.trump;
    let maker = state.maker;
    let currentPlayer = state.currentPlayerId;
    let turnedDownSuit = state.turnedDownSuit;
    let newHands = state.hands;

    if (state.phase === 'bidding_round1') {
      if (bid.suit !== 'pass') {
        trump = state.kitty!.suit;
        const player = state.players.find(p => p.id === bid.playerId);
        maker = {
          playerId: bid.playerId,
          teamId: player?.teamId || 0,
          alone: bid.alone || false,
        };

        if (newHands[state.currentDealerId]) {
          newHands = {
            ...newHands,
            [state.currentDealerId]: [...newHands[state.currentDealerId], state.kitty!],
          };
        }

        const dealerPlayer = state.players.find(p => p.id === state.currentDealerId);
        const isDealerSittingOut =
          maker.alone &&
          maker.playerId !== state.currentDealerId &&
          dealerPlayer?.teamId === maker.teamId;

        if (isDealerSittingOut) {
          newPhase = 'playing';
          currentPlayer = getNextPlayerWithAlone(state.currentDealerId, state.players, maker);
        } else {
          newPhase = 'dealer_discard';
          currentPlayer = state.currentDealerId;
        }
      } else {
        const currentPlayerIndex = state.players.findIndex(p => p.id === bid.playerId);
        const dealerIndex = state.players.findIndex(p => p.id === state.currentDealerId);

        if (currentPlayerIndex === dealerIndex) {
          newPhase = 'bidding_round2';
          turnedDownSuit = state.kitty!.suit;
          currentPlayer = getNextPlayerWithAlone(state.currentDealerId, state.players, maker);
        } else {
          currentPlayer = getNextPlayerWithAlone(bid.playerId, state.players, maker);
        }
      }
    } else if (state.phase === 'bidding_round2') {
      if (bid.suit !== 'pass') {
        trump = bid.suit as Card['suit'];
        const player = state.players.find(p => p.id === bid.playerId);
        maker = {
          playerId: bid.playerId,
          teamId: player?.teamId || 0,
          alone: bid.alone || false,
        };
        newPhase = 'playing';
        currentPlayer = getNextPlayerWithAlone(state.currentDealerId, state.players, maker);
      } else {
        const currentPlayerIndex = state.players.findIndex(p => p.id === bid.playerId);
        const dealerIndex = state.players.findIndex(p => p.id === state.currentDealerId);

        if (currentPlayerIndex === dealerIndex) {
          if (state.options.screwTheDealer) {
            return;
          } else {
            newPhase = 'dealing_animation';
            currentPlayer = getNextDealer(state.currentDealerId, state.players);
          }
        } else {
          currentPlayer = getNextPlayerWithAlone(bid.playerId, state.players, maker);
        }
      }
    }

    set({
      bids: newBids,
      phase: newPhase,
      trump,
      maker,
      turnedDownSuit,
      currentPlayerId: currentPlayer,
      currentDealerId:
        newPhase === 'dealing_animation'
          ? currentPlayer || state.currentDealerId
          : state.currentDealerId,
      hands: newPhase === 'dealing_animation' ? {} : newHands,
    });
  },

  dealerDiscard: (card: Card) => {
    const { currentDealerId, hands, players, maker } = get();

    const newHands = {
      ...hands,
      [currentDealerId]: hands[currentDealerId]?.filter(c => c.id !== card.id) || [],
    };

    set({
      hands: newHands,
      phase: 'playing',
      currentPlayerId: getNextPlayerWithAlone(currentDealerId, players, maker),
    });
  },

  setTrump: (trump: Card['suit'], makerId: string, alone?: boolean) => {
    const { players } = get();

    set({
      trump,
      maker: {
        playerId: makerId,
        teamId: players.find(p => p.id === makerId)?.teamId || 0,
        alone: alone || false,
      },
      phase: 'playing',
    });
  },
});
