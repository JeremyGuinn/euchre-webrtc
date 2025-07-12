import type { StateCreator } from 'zustand';
import type { Player, PositionIndex } from '~/types/game';
import { getTeamId } from '~/utils/game/playerUtils';
import type { GameStore } from '../gameStore';

export interface PlayerSlice {
  // State properties
  players: Player[];
  myPlayerId: string;

  // Actions
  addPlayer: (player: Player) => void;
  setMyPlayerId: (playerId: string) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerConnection: (playerId: string, isConnected: boolean) => void;
  renamePlayer: (playerId: string, newName: string) => void;
  kickPlayer: (playerId: string) => void;
  movePlayer: (playerId: string, newPosition: PositionIndex) => void;
}

export const createPlayerSlice: StateCreator<GameStore, [], [], PlayerSlice> = (set, get) => ({
  // State
  players: [],
  myPlayerId: '',

  addPlayer: (player: Player) => {
    const { players, hands } = get();

    const occupiedPositions = new Set(players.map(p => p.position));
    const availablePosition = ([0, 1, 2, 3] as const).find(pos => !occupiedPositions.has(pos));

    if (availablePosition === undefined) {
      return;
    }

    const newPlayer: Player = {
      ...player,
      position: availablePosition,
      teamId: getTeamId(availablePosition),
    };

    set({
      players: [...players, newPlayer],
      // If there's already a hand at this position (from a previously kicked player), keep it
      // Otherwise, initialize with empty hand
      hands:
        hands[availablePosition]?.length > 0
          ? hands
          : {
              ...hands,
              [availablePosition]: hands[availablePosition] || [],
            },
    });
  },

  setMyPlayerId: (playerId: string) => {
    set({ myPlayerId: playerId });
  },

  removePlayer: (playerId: string) => {
    set(state => ({
      players: state.players.filter(p => p.id !== playerId),
    }));
  },

  updatePlayerConnection: (playerId: string, isConnected: boolean) => {
    set(state => ({
      players: state.players.map(p => (p.id === playerId ? { ...p, isConnected } : p)),
    }));
  },

  renamePlayer: (playerId: string, newName: string) => {
    set(state => ({
      players: state.players.map(p => (p.id === playerId ? { ...p, name: newName } : p)),
    }));
  },

  kickPlayer: (playerId: string) => {
    const state = get();
    const kickedPlayer = state.players.find(p => p.id === playerId);

    if (!kickedPlayer) return;

    // Remove the player and clear their position's hand
    set({
      players: state.players.filter(p => p.id !== playerId),
      hands: {
        ...state.hands,
        [kickedPlayer.position]: [],
      },
    });
  },

  movePlayer: (playerId: string, newPosition: PositionIndex) => {
    const { players } = get();

    const playerToMove = players.find(p => p.id === playerId);
    if (!playerToMove) return;

    const occupyingPlayer = players.find(p => p.position === newPosition);

    set(state => ({
      players: state.players.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            position: newPosition,
            teamId: getTeamId(newPosition),
          };
        }
        if (occupyingPlayer && p.id === occupyingPlayer.id) {
          return {
            ...p,
            position: playerToMove.position,
            teamId: getTeamId(playerToMove.position),
          };
        }
        return p;
      }),
    }));
  },
});
