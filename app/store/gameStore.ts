import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createSelectors } from './createSelectors';
import { type BiddingSlice, createBiddingSlice } from './slices/biddingSlice';
import { type CoreSlice, createCoreSlice } from './slices/coreSlice';
import { type FarmersHandSlice, createFarmersHandSlice } from './slices/farmersHandSlice';
import { type GameFlowSlice, createGameFlowSlice } from './slices/gameFlowSlice';
import { type GamePlaySlice, createGamePlaySlice } from './slices/gamePlaySlice';
import { type OptionsSlice, createOptionsSlice } from './slices/optionsSlice';
import { type PlayerSlice, createPlayerSlice } from './slices/playerSlice';
import { type TeamSlice, createTeamSlice } from './slices/teamSlice';

export type GameStore = BiddingSlice &
  CoreSlice &
  FarmersHandSlice &
  GameFlowSlice &
  OptionsSlice &
  PlayerSlice &
  GamePlaySlice &
  TeamSlice;

const gameStoreBase = create<GameStore>()(
  devtools(
    subscribeWithSelector<GameStore>((...a) => ({
      // Combine all slices
      ...createBiddingSlice(...a),
      ...createCoreSlice(...a),
      ...createFarmersHandSlice(...a),
      ...createGameFlowSlice(...a),
      ...createOptionsSlice(...a),
      ...createPlayerSlice(...a),
      ...createGamePlaySlice(...a),
      ...createTeamSlice(...a),
    })),
    {
      name: 'euchere-webrtc',
      store: 'gameStore',
    }
  )
);

export const gameStore = createSelectors(gameStoreBase);
