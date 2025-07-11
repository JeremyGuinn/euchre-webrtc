import type { StateCreator } from 'zustand';
import type { Bid, Card, PositionIndex } from '~/types/game';
import { getNextDealerPosition, getNextPlayerPositionWithAlone } from '~/utils/game/playerUtils';
import type { GameStore } from '../gameStore';

export interface BiddingSlice {
  placeBid: (bid: Bid) => void;
  dealerDiscard: (card: Card) => void;
  setTrump: (trump: Card['suit'], makerPosition: PositionIndex, alone?: boolean) => void;
}

export const createBiddingSlice: StateCreator<GameStore, [], [], BiddingSlice> = (set, get) => ({
  placeBid: (bid: Bid) => {
    const state = get();
    const newBids = [...state.bids, bid];

    let newPhase = state.phase;
    let trump = state.trump;
    let maker = state.maker;
    let currentPlayerPosition = state.currentPlayerPosition;
    let turnedDownSuit = state.turnedDownSuit;
    let newHands = state.hands;

    if (state.phase === 'bidding_round1') {
      if (bid.suit !== 'pass') {
        trump = state.kitty!.suit;
        const player = state.players.find(p => p.position === bid.playerPosition);
        maker = {
          playerPosition: bid.playerPosition,
          teamId: player?.teamId || 0,
          alone: bid.alone || false,
        };

        // Add kitty to dealer's hand
        if (newHands[state.currentDealerPosition]) {
          newHands = {
            ...newHands,
            [state.currentDealerPosition]: [...newHands[state.currentDealerPosition], state.kitty!],
          };
        }

        const dealerPlayer = state.players.find(p => p.position === state.currentDealerPosition);
        const isDealerSittingOut =
          maker.alone &&
          maker.playerPosition !== state.currentDealerPosition &&
          dealerPlayer?.teamId === maker.teamId;

        if (isDealerSittingOut) {
          newPhase = 'playing';
          currentPlayerPosition = getNextPlayerPositionWithAlone(
            state.currentDealerPosition,
            maker
          );
        } else {
          newPhase = 'dealer_discard';
          currentPlayerPosition = state.currentDealerPosition;
        }
      } else {
        const currentPlayerIndex = state.players.findIndex(p => p.position === bid.playerPosition);
        const dealerIndex = state.players.findIndex(
          p => p.position === state.currentDealerPosition
        );

        if (currentPlayerIndex === dealerIndex) {
          newPhase = 'bidding_round2';
          turnedDownSuit = state.kitty!.suit;
          currentPlayerPosition = getNextPlayerPositionWithAlone(
            state.currentDealerPosition,
            maker
          );
        } else {
          currentPlayerPosition = getNextPlayerPositionWithAlone(bid.playerPosition, maker);
        }
      }
    } else if (state.phase === 'bidding_round2') {
      if (bid.suit !== 'pass') {
        trump = bid.suit as Card['suit'];
        const player = state.players.find(p => p.position === bid.playerPosition);
        maker = {
          playerPosition: bid.playerPosition,
          teamId: player?.teamId || 0,
          alone: bid.alone || false,
        };
        newPhase = 'playing';
        currentPlayerPosition = getNextPlayerPositionWithAlone(state.currentDealerPosition, maker);
      } else {
        const currentPlayerIndex = state.players.findIndex(p => p.position === bid.playerPosition);
        const dealerIndex = state.players.findIndex(
          p => p.position === state.currentDealerPosition
        );

        if (currentPlayerIndex === dealerIndex) {
          if (state.options.screwTheDealer) {
            return;
          } else {
            newPhase = 'dealing_animation';
            currentPlayerPosition = getNextDealerPosition(state.currentDealerPosition);
          }
        } else {
          currentPlayerPosition = getNextPlayerPositionWithAlone(bid.playerPosition, maker);
        }
      }
    }

    set({
      bids: newBids,
      phase: newPhase,
      trump,
      maker,
      turnedDownSuit,
      currentPlayerPosition,
      currentDealerPosition:
        newPhase === 'dealing_animation'
          ? currentPlayerPosition || state.currentDealerPosition
          : state.currentDealerPosition,
      hands: newPhase === 'dealing_animation' ? ({} as Record<PositionIndex, Card[]>) : newHands,
    });
  },

  dealerDiscard: (card: Card) => {
    const { currentDealerPosition, hands, players, maker } = get();

    const newHands = {
      ...hands,
      [currentDealerPosition]: hands[currentDealerPosition]?.filter(c => c.id !== card.id) || [],
    };

    set({
      hands: newHands,
      phase: 'playing',
      currentPlayerPosition: getNextPlayerPositionWithAlone(currentDealerPosition, maker),
    });
  },

  setTrump: (trump: Card['suit'], makerPosition: PositionIndex, alone?: boolean) => {
    const { players } = get();

    const makerPlayer = players.find(p => p.position === makerPosition);
    set({
      trump,
      maker: {
        playerPosition: makerPosition,
        teamId: makerPlayer?.teamId || 0,
        alone: alone || false,
      },
      phase: 'playing',
    });
  },
});
