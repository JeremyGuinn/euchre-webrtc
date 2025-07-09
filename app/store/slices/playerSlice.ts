import type { StateCreator } from 'zustand';
import type { Card, Player } from '~/types/game';
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
    const { players } = get();

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

    set(state => ({
      players: [...state.players, newPlayer],
    }));
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

    const updatedPlayer: Player = {
      ...playerToReconnect,
      id: newPlayerId,
      name: playerName,
      isConnected: true,
    };

    const newHands: Record<string, Card[]> = { ...state.hands };
    if (state.hands[oldPlayerId]) {
      newHands[newPlayerId] = state.hands[oldPlayerId];
      delete newHands[oldPlayerId];
    }

    const newCurrentDealerId =
      state.currentDealerId === oldPlayerId ? newPlayerId : state.currentDealerId;

    const newCurrentPlayerId =
      state.currentPlayerId === oldPlayerId ? newPlayerId : state.currentPlayerId;

    const newBids = state.bids.map(bid =>
      bid.playerId === oldPlayerId ? { ...bid, playerId: newPlayerId } : bid
    );

    const newCurrentTrick = state.currentTrick
      ? {
          ...state.currentTrick,
          cards: state.currentTrick.cards.map(card =>
            card.playerId === oldPlayerId ? { ...card, playerId: newPlayerId } : card
          ),
        }
      : undefined;

    const newCompletedTricks = state.completedTricks.map(trick => ({
      ...trick,
      winnerId: trick.winnerId === oldPlayerId ? newPlayerId : trick.winnerId,
      cards: trick.cards.map(card =>
        card.playerId === oldPlayerId ? { ...card, playerId: newPlayerId } : card
      ),
    }));

    const newMaker =
      state.maker?.playerId === oldPlayerId
        ? { ...state.maker, playerId: newPlayerId }
        : state.maker;

    let newDealerSelectionCards = state.dealerSelectionCards;
    if (state.dealerSelectionCards && state.dealerSelectionCards[oldPlayerId]) {
      const newCards = { ...state.dealerSelectionCards };
      newCards[newPlayerId] = newCards[oldPlayerId];
      delete newCards[oldPlayerId];
      newDealerSelectionCards = newCards;
    }

    const newFarmersHandPlayer =
      state.farmersHandPlayer === oldPlayerId ? newPlayerId : state.farmersHandPlayer;

    set({
      players: state.players.map(p => (p.id === oldPlayerId ? updatedPlayer : p)),
      hands: newHands,
      currentDealerId: newCurrentDealerId,
      currentPlayerId: newCurrentPlayerId,
      bids: newBids,
      currentTrick: newCurrentTrick,
      completedTricks: newCompletedTricks,
      maker: newMaker,
      dealerSelectionCards: newDealerSelectionCards,
      farmersHandPlayer: newFarmersHandPlayer,
    });
  },

  renamePlayer: (playerId: string, newName: string) => {
    set(state => ({
      players: state.players.map(p => (p.id === playerId ? { ...p, name: newName } : p)),
    }));
  },

  kickPlayer: (playerId: string) => {
    set(state => ({
      players: state.players.filter(p => p.id !== playerId),
    }));
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
