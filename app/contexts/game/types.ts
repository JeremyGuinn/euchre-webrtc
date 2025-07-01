import type { GameState, Player, Card, GameOptions } from "../../types/game";
import type { NetworkManager } from "../../utils/networking";

export interface GameContextType {
  gameState: GameState;
  networkManager: NetworkManager | null;
  myPlayerId: string;
  isHost: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";

  // Actions
  hostGame: () => Promise<string>; // Returns base64 game code for display
  joinGame: (gameCode: string, playerName: string) => Promise<void>; // Accepts base64 game code
  startGame: () => void;
  selectDealer: () => void;
  drawDealerCard: () => void;
  completeDealerSelection: () => void;
  placeBid: (suit: Card["suit"] | "pass", alone?: boolean) => void;
  playCard: (card: Card) => void;
  dealerDiscard: (card: Card) => void;
  disconnect: () => void;

  // Host or self actions
  renamePlayer: (playerId: string, newName: string) => void;

  // Host-only actions
  kickPlayer: (playerId: string) => void;
  movePlayer: (playerId: string, newPosition: 0 | 1 | 2 | 3) => void;
  updateGameOptions: (options: GameOptions) => void;

  // Event callbacks
  onKicked?: (message: string) => void;

  // Utilities
  canPlay: (card: Card) => boolean;
  isMyTurn: () => boolean;
  getMyPlayer: () => Player | undefined;
  getMyHand: () => Card[];
  getDisplayGameCode: () => string; // Gets the base64 game code for display
}

export interface GameProviderProps {
  children: React.ReactNode;
  onKicked?: (message: string) => void;
}
