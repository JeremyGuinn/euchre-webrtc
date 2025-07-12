import type { StateCreator } from 'zustand';
import type {
  Card,
  GamePhase,
  GameState,
  Player,
  PositionIndex,
  PublicGameState,
} from '~/types/game';
import type { GameStore } from '../gameStore';

export interface CoreSlice {
  // State properties
  id: string;
  gameCode: string | undefined;
  isHost: boolean;

  // Actions
  initGame: (hostId: string, gameId: string, gameCode?: string) => void;
  resetGame: () => void;
  setIsHost: (isHost: boolean) => void;
  restoreGameState: (gameState: GameState) => void;
  syncState: (gameState: PublicGameState, playerHand?: Card[], receivingPlayerId?: string) => void;
  setCurrentPlayerPosition: (position: PositionIndex) => void;
  setPhase: (phase: GamePhase) => void;
  createPublicGameState: (forPlayerId?: string) => PublicGameState;
  isDealerScrewed: () => boolean;
}

export const createCoreSlice: StateCreator<GameStore, [], [], CoreSlice> = (set, get) => ({
  // Core state
  id: '',
  gameCode: undefined,
  isHost: false,

  initGame: (hostId: string, gameId: string, gameCode?: string) => {
    const player: Player = {
      id: hostId,
      name: 'Host',
      isHost: true,
      isConnected: true,
      position: 0,
      teamId: 0,
    };

    set({
      id: gameId,
      gameCode,
      myPlayerId: hostId,
      isHost: true,
      phase: 'lobby',
      players: [player],
      options: {
        teamSelection: 'predetermined',
        dealerSelection: 'random_cards',
        allowReneging: false,
        screwTheDealer: false,
        farmersHand: false,
      },
      currentDealerPosition: 0,
      deck: [],
      hands: { 0: [], 1: [], 2: [], 3: [] },
      bids: [],
      completedTricks: [],
      scores: { team0: 0, team1: 0 },
      handScores: { team0: 0, team1: 0 },
      teamNames: { team0: 'Team 1', team1: 'Team 2' },
    });
  },

  resetGame: () => {
    // used to reset the game state when starting a new game after finishing one,
    // it should keep the game code and players intact, but reset game specific state
    const state = get();
    set({
      ...state,
      phase: 'lobby',
      currentDealerPosition: 0,
      deck: [],
      hands: { 0: [], 1: [], 2: [], 3: [] },
      bids: [],
      completedTricks: [],
      scores: { team0: 0, team1: 0 },
      handScores: { team0: 0, team1: 0 },
    });
  },

  setIsHost: (isHost: boolean) => {
    const state = get();
    const updatedPlayers = state.players.map(player =>
      player.id === state.myPlayerId ? { ...player, isHost } : player
    );

    set({ players: updatedPlayers, isHost });
  },

  restoreGameState: (gameState: GameState) => {
    set(gameState);
  },

  syncState: (gameState: PublicGameState, playerHand?: Card[], receivingPlayerId?: string) => {
    const state = get();
    const receivingPlayer = receivingPlayerId
      ? state.players.find(p => p.id === receivingPlayerId)
      : undefined;
    const newHands = { 0: [], 1: [], 2: [], 3: [] } as Record<PositionIndex, Card[]>;

    if (playerHand && receivingPlayer) {
      newHands[receivingPlayer.position] = playerHand;
    }

    set({
      ...state,
      id: gameState.id,
      players: gameState.players,
      teamNames: gameState.teamNames,
      phase: gameState.phase,
      options: gameState.options,
      currentDealerPosition: gameState.currentDealerPosition,
      currentPlayerPosition: gameState.currentPlayerPosition,
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
      hands: newHands,
      deck: gameState.deck,
      farmersHandPosition: gameState.farmersHandPosition,
    });
  },

  setCurrentPlayerPosition: (position: PositionIndex) => {
    set({ currentPlayerPosition: position });
  },

  setPhase: (phase: GamePhase) => {
    set({ phase });
  },

  createPublicGameState: (forPlayerId?: string): PublicGameState => {
    const state = get();
    const requestingPlayer = forPlayerId
      ? state.players.find(p => p.id === forPlayerId)
      : undefined;

    const placeholderCards: Card[] = Array.from({ length: 24 }, (_, index) => ({
      id: `placeholder-${index}`,
      suit: 'spades' as const,
      value: 'A' as const,
    }));

    const publicState: PublicGameState = {
      id: state.id,
      isHost: state.players.some(p => p.id === state.myPlayerId && p.isHost),
      gameCode: state.gameCode,
      players: state.players,
      phase: state.phase,
      options: state.options,
      currentDealerPosition: state.currentDealerPosition,
      currentPlayerPosition: state.currentPlayerPosition,
      trump: state.trump,
      kitty: state.kitty,
      turnedDownSuit: state.turnedDownSuit,
      bids: state.bids,
      currentTrick: state.currentTrick,
      completedTricks: state.completedTricks,
      scores: state.scores,
      handScores: state.handScores,
      maker: state.maker,
      dealerSelectionCards: state.dealerSelectionCards,
      deck: placeholderCards,
      farmersHandPosition: state.farmersHandPosition,
      firstBlackJackDealing: state.firstBlackJackDealing,
      teamNames: state.teamNames,
    };

    // Include player's hand if they're requesting their own state
    if (requestingPlayer && state.hands[requestingPlayer.position]) {
      publicState.playerHand = state.hands[requestingPlayer.position];
    }

    return publicState;
  },

  isDealerScrewed: (): boolean => {
    const state = get();

    // Only applies in round 2 with screw-the-dealer enabled
    if (state.phase !== 'bidding_round2' || !state.options.screwTheDealer) {
      return false;
    }

    // Check if current player is the dealer
    if (state.currentPlayerPosition !== state.currentDealerPosition) {
      return false;
    }

    // In round 2, the dealer is screwed if everyone else has passed
    const round1Passes = 4; // Each position passes once in round 1
    const round2Bids = state.bids.slice(round1Passes);

    // Count how many non-dealer positions have passed in round 2
    const round2Passes = round2Bids.filter(
      bid => bid.suit === 'pass' && bid.playerPosition !== state.currentDealerPosition
    ).length;

    // If all 3 other positions have passed in round 2, dealer is screwed
    return round2Passes === 3;
  },
});
