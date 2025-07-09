import type { StateCreator } from 'zustand';
import type { Card, Trick } from '~/types/game';
import {
  calculateHandScore,
  getEffectiveSuit,
  getExpectedTrickSize,
  getWinningCard,
} from '~/utils/gameLogic';
import { getNextDealer, getNextPlayerWithAlone } from '~/utils/playerUtils';
import type { GameStore } from '../gameStore';

export interface PlayingSlice {
  playCard: (card: Card, playerId: string) => void;
  completeTrick: () => void;
  completeHand: () => void;
}

export const createPlayingSlice: StateCreator<GameStore, [], [], PlayingSlice> = (set, get) => ({
  playCard: (card: Card, playerId: string) => {
    const state = get();

    if (!state.currentTrick) {
      const newTrick: Trick = {
        id: crypto.randomUUID(),
        cards: [{ card, playerId }],
        leaderId: playerId,
      };

      set({
        currentTrick: newTrick,
        hands: {
          ...state.hands,
          [playerId]: state.hands[playerId].filter(c => c.id !== card.id),
        },
        currentPlayerId: getNextPlayerWithAlone(playerId, state.players, state.maker),
      });
      return;
    }

    const updatedTrick = {
      ...state.currentTrick,
      cards: [...state.currentTrick.cards, { card, playerId }],
    };

    const newHands = {
      ...state.hands,
      [playerId]: state.hands[playerId].filter(c => c.id !== card.id),
    };

    const expectedTrickSize = getExpectedTrickSize(state.maker);

    if (updatedTrick.cards.length !== expectedTrickSize) {
      set({
        hands: newHands,
        currentTrick: updatedTrick,
        currentPlayerId: getNextPlayerWithAlone(playerId, state.players, state.maker),
      });
      return;
    }

    const leadSuit = state.trump
      ? getEffectiveSuit(updatedTrick.cards[0].card, state.trump)
      : updatedTrick.cards[0].card.suit;

    const winningPlay = getWinningCard(updatedTrick.cards, state.trump!, leadSuit);
    updatedTrick.winnerId = winningPlay.playerId;

    const newCompletedTricks = [...state.completedTricks, updatedTrick];

    if (newCompletedTricks.length !== 5) {
      set({
        hands: newHands,
        currentTrick: undefined,
        completedTricks: newCompletedTricks,
        phase: 'trick_complete',
        currentPlayerId: winningPlay.playerId,
      });
      return;
    }

    if (!state.maker) return;

    const handScores = calculateHandScore(
      newCompletedTricks,
      state.players,
      state.maker.teamId,
      state.maker.alone
    );

    const newScores = {
      team0: state.scores.team0 + handScores.team0,
      team1: state.scores.team1 + handScores.team1,
    };

    const gameComplete = newScores.team0 >= 10 || newScores.team1 >= 10;

    set({
      handScores,
      hands: newHands,
      currentTrick: undefined,
      completedTricks: newCompletedTricks,
      currentPlayerId: winningPlay.playerId,
      scores: newScores,
      phase: gameComplete ? 'game_complete' : 'hand_complete',
    });
  },

  completeTrick: () => {
    set({ phase: 'playing' });
  },

  completeHand: () => {
    const { currentDealerId, players, phase } = get();

    set({
      phase: 'dealing_animation',
      currentDealerId: getNextDealer(currentDealerId, players),
      completedTricks: [],
      trump: undefined,
      maker: undefined,
      bids: [],
      hands: phase === 'game_complete' ? get().hands : {},
      currentTrick: undefined,
      turnedDownSuit: undefined,
      handScores: { team0: 0, team1: 0 },
    });
  },
});
