import type { GameState } from '../../types/game';
import type { BaseMessage, GameMessage, MessageType } from '../../types/messages';
import type { GameAction } from '../../utils/gameState';

import type { ConnectionStatus, NetworkManager } from '~/utils/networking';

/**
 * Context object that contains all the necessary state and functions
 * that message handlers need to process messages and update the game state.
 */
export interface HandlerContext {
  /** Current state of the game including players, cards, scores, etc. */
  gameState: GameState;

  /** The ID of the current player/client */
  myPlayerId: string;

  /** Whether this client is the host of the game */
  isHost: boolean;

  /** React dispatch function to update the game state */
  dispatch: React.Dispatch<GameAction>;

  /** Network manager instance for sending messages to other players */
  networkManager: NetworkManager;

  /** Function to broadcast the current game state to all connected players */
  broadcastGameState: () => void;

  /** Optional callback triggered when this player is kicked from the game */
  onKicked?: (message: string) => void;

  /** Function to update the connection status in the UI */
  setConnectionStatus: (status: ConnectionStatus) => void;

  /** Function to update the current player's ID */
  setMyPlayerId: (id: string) => void;

  /** Function to update whether this client is the host */
  setIsHost: (isHost: boolean) => void;
}

/**
 * Generic message handler type that can handle any GameMessage.
 * It takes a message of type T, the sender's ID, and the context in which the handler is executed.
 */
export type MessageHandler<T extends BaseMessage> = (
  message: T,
  senderId: string,
  context: HandlerContext
) => void;

/**
 * Extract specific message type from GameMessage union based on the 'type' property
 */
type ExtractMessageType<T extends MessageType> = Extract<
  GameMessage,
  { type: T }
>;

/**
 * Generate handler types automatically from all message types.
 * This ensures that every message type has a corresponding handler.
 * If a new message type is added to MessageType, TypeScript will require
 * a handler to be defined for it.
 */
export type MessageHandlers = {
  [K in MessageType]: MessageHandler<ExtractMessageType<K>>;
};


export type PeerMessageHandlers = {
  [K in MessageType]: PeerMessageHandlers;
}