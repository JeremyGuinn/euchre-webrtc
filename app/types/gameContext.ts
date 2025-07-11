import type { ConnectionStatus, NetworkManager } from '~/network/networkManager';
import type { Card, GameOptions, GameState } from './game';

export interface GameContextType {
  gameState: GameState;
  networkManager: NetworkManager | null;
  myPlayerId: string | undefined;
  connectionStatus: ConnectionStatus;

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
}

export interface GameProviderProps {
  children: React.ReactNode;
}
