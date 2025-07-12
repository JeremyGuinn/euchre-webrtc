import type { ConnectionStatus, NetworkManager } from '~/network/networkManager';
import type { PositionIndex, TeamIndex } from '~/types/game';
import type { Card, GameOptions } from './game';

export interface GameError {
  message: string;
  code?: string;
  timestamp: number;
}

export interface GameContextType {
  networkManager: NetworkManager | null;
  connectionStatus: ConnectionStatus;
  currentError: GameError | null;

  hostGame: () => Promise<string>;
  joinGame: (gameCode: string, playerName: string) => Promise<void>;
  startGame: () => void;
  selectDealer: () => void;
  drawDealerCard: (cardIndex?: number) => void;
  dealFirstBlackJackCard: () => void;
  completeBlackJackDealerSelection: () => void;
  proceedToDealing: () => void;
  completeDealingAnimation: () => void;
  placeBid: (suit: Card['suit'] | 'pass', alone?: boolean) => void;
  playCard: (card: Card) => void;
  dealerDiscard: (card: Card) => void;
  reorderHand: (newOrder: Card[]) => void;
  swapFarmersHand: (cardsToSwap: Card[]) => void;
  declineFarmersHand: () => void;
  continueTrick: () => void;
  completeHand: () => void;
  leaveGame: (reason?: 'manual' | 'error' | 'network') => Promise<void>;

  clearError: () => void;
  setError: (message: string, code?: string) => void;

  renamePlayer: (playerId: string, newName: string) => void;
  renameTeam: (teamId: TeamIndex, newName: string) => void;

  kickPlayer: (playerId: string) => void;
  movePlayer: (playerId: string, newPosition: PositionIndex) => void;
  updateGameOptions: (options: GameOptions) => void;
  setPredeterminedDealer: (playerId: string) => void;
}

export interface GameProviderProps {
  children: React.ReactNode;
}
