import type { StateCreator } from 'zustand';
import type { Card, Trick } from '~/types/game';
import {
  calculateHandScore,
  getEffectiveSuit,
  getExpectedTrickSize,
  getWinningCard,
} from '~/utils/game/gameLogic';
import { getNextDealerPosition, getNextPlayerPositionWithAlone } from '~/utils/game/playerUtils';
import type { GameStore } from '../gameStore';

export interface PlayingSlice {
  playCard: (card: Card, playerPosition: 0 | 1 | 2 | 3) => void;
  completeTrick: () => void;
  completeHand: () => void;
}

export const createPlayingSlice: StateCreator<GameStore, [], [], PlayingSlice> = (set, get) => ({
  playCard: (card: Card, playerPosition: 0 | 1 | 2 | 3) => {
    const state = get();

    if (!state.currentTrick) {
      const newTrick: Trick = {
        id: crypto.randomUUID(),
        cards: [{ card, playerPosition }],
        leaderPosition: playerPosition,
      };

      set({
        currentTrick: newTrick,
        hands: {
          ...state.hands,
          [playerPosition]: state.hands[playerPosition].filter(c => c.id !== card.id),
        },
        currentPlayerPosition: getNextPlayerPositionWithAlone(playerPosition, state.maker),
      });
      return;
    }

    const updatedTrick = {
      ...state.currentTrick,
      cards: [...state.currentTrick.cards, { card, playerPosition }],
    };

    const newHands = {
      ...state.hands,
      [playerPosition]: state.hands[playerPosition].filter(c => c.id !== card.id),
    };

    const expectedTrickSize = getExpectedTrickSize(state.maker);

    if (updatedTrick.cards.length !== expectedTrickSize) {
      set({
        hands: newHands,
        currentTrick: updatedTrick,
        currentPlayerPosition: getNextPlayerPositionWithAlone(playerPosition, state.maker),
      });
      return;
    }

    const leadSuit = state.trump
      ? getEffectiveSuit(updatedTrick.cards[0].card, state.trump)
      : updatedTrick.cards[0].card.suit;

    const winningPlay = getWinningCard(updatedTrick.cards, state.trump!, leadSuit);
    updatedTrick.winnerPosition = winningPlay.playerPosition;

    const newCompletedTricks = [...state.completedTricks, updatedTrick];

    if (newCompletedTricks.length !== 5) {
      set({
        hands: newHands,
        currentTrick: undefined,
        completedTricks: newCompletedTricks,
        phase: 'trick_complete',
        currentPlayerPosition: winningPlay.playerPosition,
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
      currentPlayerPosition: winningPlay.playerPosition,
      scores: newScores,
      phase: gameComplete ? 'game_complete' : 'hand_complete',
    });
  },

  completeTrick: () => {
    set({ phase: 'playing' });
  },

  completeHand: () => {
    const { currentDealerPosition, phase } = get();

    set({
      phase: 'dealing_animation',
      currentDealerPosition: getNextDealerPosition(currentDealerPosition),
      completedTricks: [],
      trump: undefined,
      maker: undefined,
      bids: [],
      hands: phase === 'game_complete' ? get().hands : ({} as Record<0 | 1 | 2 | 3, Card[]>),
      currentTrick: undefined,
      turnedDownSuit: undefined,
      handScores: { team0: 0, team1: 0 },
    });
  },
});
