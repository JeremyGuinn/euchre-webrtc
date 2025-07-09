import type { StateCreator } from 'zustand';
import type { Player } from '~/types/game';
import { getTeamId } from '~/utils/game/playerUtils';
import type { GameStore } from '../gameStore';

export interface PlayerSlice {
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerConnection: (playerId: string, isConnected: boolean) => void;
  reconnectPlayer: (oldPlayerId: string, newPlayerId: string, playerName: string) => void;
  renamePlayer: (playerId: string, newName: string) => void;
  kickPlayer: (playerId: string) => void;
  movePlayer: (playerId: string, newPosition: 0 | 1 | 2 | 3) => void;
}

export const createPlayerSlice: StateCreator<GameStore, [], [], PlayerSlice> = (set, get) => ({
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

  reconnectPlayer: (oldPlayerId: string, newPlayerId: string, playerName: string) => {
    const state = get();

    const playerToReconnect = state.players.find(p => p.id === oldPlayerId);
    if (!playerToReconnect) {
      return;
    }

    // Simple player data update - all game state uses positions now
    const updatedPlayer: Player = {
      ...playerToReconnect,
      id: newPlayerId,
      name: playerName,
      isConnected: true,
    };

    set({
      players: state.players.map(p => (p.id === oldPlayerId ? updatedPlayer : p)),
    });
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

  movePlayer: (playerId: string, newPosition: 0 | 1 | 2 | 3) => {
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
