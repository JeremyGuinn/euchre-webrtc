import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameState } from '~/types/game';
import type {
  BiddingSlice,
  CoreSlice,
  FarmersHandSlice,
  GameFlowSlice,
  OptionsSlice,
  PlayerSlice,
  PlayingSlice,
  TeamSlice,
} from './slices';
import {
  createBiddingSlice,
  createCoreSlice,
  createFarmersHandSlice,
  createGameFlowSlice,
  createOptionsSlice,
  createPlayerSlice,
  createPlayingSlice,
  createTeamSlice,
} from './slices';

export interface GameStore
  extends GameState,
    BiddingSlice,
    CoreSlice,
    FarmersHandSlice,
    GameFlowSlice,
    OptionsSlice,
    PlayerSlice,
    PlayingSlice,
    TeamSlice {}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((...a) => ({
    id: '',
    players: [],
    phase: 'lobby',
    options: {
      teamSelection: 'predetermined',
      dealerSelection: 'random_cards',
      allowReneging: false,
      screwTheDealer: false,
      farmersHand: false,
    },
    currentDealerId: '',
    deck: [],
    hands: {},
    bids: [],
    completedTricks: [],
    scores: { team0: 0, team1: 0 },
    handScores: { team0: 0, team1: 0 },
    teamNames: { team0: 'Team 1', team1: 'Team 2' },

    ...createBiddingSlice(...a),
    ...createCoreSlice(...a),
    ...createFarmersHandSlice(...a),
    ...createGameFlowSlice(...a),
    ...createOptionsSlice(...a),
    ...createPlayerSlice(...a),
    ...createPlayingSlice(...a),
    ...createTeamSlice(...a),
  }))
);
