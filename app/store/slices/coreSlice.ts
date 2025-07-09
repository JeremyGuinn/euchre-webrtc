import type { StateCreator } from 'zustand';
import type { Card, GameState, PublicGameState } from '~/types/game';
import type { GameStore } from '../gameStore';

export interface CoreSlice {
  initGame: (hostId: string, gameId: string, gameCode?: string) => void;
  restoreGameState: (gameState: GameState) => void;
  syncState: (gameState: PublicGameState, playerHand?: Card[], receivingPlayerId?: string) => void;
  setCurrentPlayer: (playerId: string) => void;
  setPhase: (phase: GameState['phase']) => void;
  createPublicGameState: (forPlayerId?: string) => PublicGameState;
  isDealerScrewed: () => boolean;
}

export const createCoreSlice: StateCreator<GameStore, [], [], CoreSlice> = (set, get) => ({
  initGame: (hostId: string, gameId: string, gameCode?: string) => {
    set({
      id: gameId,
      gameCode,
      players: [
        {
          id: hostId,
          name: 'Host',
          isHost: true,
          isConnected: true,
          position: 0,
          teamId: 0,
        },
      ],
      phase: 'lobby',
      options: {
        teamSelection: 'predetermined',
        dealerSelection: 'random_cards',
        allowReneging: false,
        screwTheDealer: false,
        farmersHand: false,
      },
      currentDealerId: hostId,
      deck: [],
      hands: {},
      bids: [],
      completedTricks: [],
      scores: { team0: 0, team1: 0 },
      handScores: { team0: 0, team1: 0 },
      teamNames: { team0: 'Team 1', team1: 'Team 2' },
    });
  },

  restoreGameState: (gameState: GameState) => {
    set(gameState);
  },

  syncState: (gameState: PublicGameState, playerHand?: Card[], receivingPlayerId?: string) => {
    set({
      ...get(),
      id: gameState.id,
      players: gameState.players,
      teamNames: gameState.teamNames,
      phase: gameState.phase,
      options: gameState.options,
      currentDealerId: gameState.currentDealerId,
      currentPlayerId: gameState.currentPlayerId,
      trump: gameState.trump,
      kitty: gameState.kitty,
      turnedDownSuit: gameState.turnedDownSuit,
      bids: gameState.bids,
      currentTrick: gameState.currentTrick,
      completedTricks: gameState.completedTricks,
      scores: gameState.scores,
      handScores: gameState.handScores,
      maker: gameState.maker,
      dealerSelectionCards: gameState.dealerSelectionCards,
      hands: playerHand && receivingPlayerId ? { [receivingPlayerId]: playerHand } : {},
      deck: gameState.deck,
      farmersHandPlayer: gameState.farmersHandPlayer,
    });
  },

  setCurrentPlayer: (playerId: string) => {
    set({ currentPlayerId: playerId });
  },

  setPhase: (phase: GameState['phase']) => {
    set({ phase });
  },

  createPublicGameState: (forPlayerId?: string): PublicGameState => {
    const state = get();

    const placeholderCards: [Card, Card, Card] = [
      { id: `placeholder-${0}`, suit: 'spades' as const, value: 'A' as const },
      { id: `placeholder-${1}`, suit: 'spades' as const, value: 'A' as const },
      { id: `placeholder-${2}`, suit: 'spades' as const, value: 'A' as const },
    ];

    const publicState: PublicGameState = {
      id: state.id,
      gameCode: state.gameCode,
      players: state.players,
      phase: state.phase,
      options: state.options,
      currentDealerId: state.currentDealerId,
      currentPlayerId: state.currentPlayerId,
      trump: state.trump,
      kitty: state.kitty,
      turnedDownSuit: state.turnedDownSuit,
      bids: state.bids,
      currentTrick: state.currentTrick,
      completedTricks: state.completedTricks,
      scores: state.scores,
      handScores: state.handScores,
      teamNames: state.teamNames,
      maker: state.maker,
      farmersHandPlayer: state.farmersHandPlayer,
      dealerSelectionCards: state.dealerSelectionCards,
      firstBlackJackDealing: state.firstBlackJackDealing,
      deck: placeholderCards,
    };

    if (forPlayerId && state.hands[forPlayerId]) {
      publicState.playerHand = state.hands[forPlayerId];
    }

    return publicState;
  },

  isDealerScrewed: (): boolean => {
    const state = get();

    if (state.phase !== 'bidding_round2' || !state.options.screwTheDealer) {
      return false;
    }

    if (state.currentPlayerId !== state.currentDealerId) {
      return false;
    }

    const round1Passes = state.players.length;
    const round2Bids = state.bids.slice(round1Passes);

    const round2Passes = round2Bids.filter(
      bid => bid.suit === 'pass' && bid.playerId !== state.currentDealerId
    ).length;

    return round2Passes === 3;
  },
});
