import type { ConnectionStatus, NetworkManager } from '~/utils/networking';
import type { Card, GameOptions, GameState, Player } from './game';

export interface ReconnectionStatus {
  isReconnecting: boolean;
  attempt: number;
  maxRetries: number;
  reason?: string;
}

export interface GameContextType {
  gameState: GameState;
  networkManager: NetworkManager | null;
  myPlayerId: string;
  isHost: boolean;
  connectionStatus: ConnectionStatus;
  reconnectionStatus: ReconnectionStatus;

  hostGame: () => Promise<string>;
  joinGame: (gameCode: string, playerName: string) => Promise<void>;
  attemptReconnection: () => Promise<boolean>;
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
  swapFarmersHand: (cardsToSwap: Card[]) => void;
  declineFarmersHand: () => void;
  continueTrick: () => void;
  completeHand: () => void;
  leaveGame: (reason?: 'manual' | 'error' | 'network') => Promise<void>;

  renamePlayer: (playerId: string, newName: string) => void;
  renameTeam: (teamId: 0 | 1, newName: string) => void;

  kickPlayer: (playerId: string) => void;
  movePlayer: (playerId: string, newPosition: 0 | 1 | 2 | 3) => void;
  updateGameOptions: (options: GameOptions) => void;
  setPredeterminedDealer: (playerId: string) => void;

  canPlay: (card: Card) => boolean;
  isMyTurn: () => boolean;
  isSittingOut: () => boolean;
  getMyPlayer: () => Player | undefined;
  getMyHand: () => Card[];
}

export interface GameProviderProps {
  children: React.ReactNode;
}
