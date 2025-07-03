import type { Card, GameOptions, GameState, Player } from '../../types/game';
import type { ConnectionStatus, NetworkManager } from '../../utils/networking';

export interface GameContextType {
  gameState: GameState;
  networkManager: NetworkManager | null;
  myPlayerId: string;
  isHost: boolean;
  connectionStatus: ConnectionStatus;

  hostGame: () => Promise<string>;
  joinGame: (gameCode: string, playerName: string) => Promise<void>;
  startGame: () => void;
  selectDealer: () => void;
  drawDealerCard: (cardIndex?: number) => void;
  dealerSelectionCardDealt: (playerId: string, card: Card) => void;
  completeDealerSelection: () => void;
  proceedToDealing: () => void;
  completeDealingAnimation: () => void;
  placeBid: (suit: Card['suit'] | 'pass', alone?: boolean) => void;
  playCard: (card: Card) => void;
  dealerDiscard: (card: Card) => void;
  continueTrick: () => void;
  completeHand: () => void;
  disconnect: () => void;

  renamePlayer: (playerId: string, newName: string) => void;

  kickPlayer: (playerId: string) => void;
  movePlayer: (playerId: string, newPosition: 0 | 1 | 2 | 3) => void;
  updateGameOptions: (options: GameOptions) => void;

  onKicked?: (message: string) => void;

  canPlay: (card: Card) => boolean;
  isMyTurn: () => boolean;
  getMyPlayer: () => Player | undefined;
  getMyHand: () => Card[];
}

export interface GameProviderProps {
  children: React.ReactNode;
  onKicked?: (message: string) => void;
}
