import type { SessionData } from '~/contexts/SessionContext';
import type { GameStore } from '~/store/gameStore';
import type {
  BaseMessage,
  ClientToHostMessage,
  GameMessage,
  HostToClientMessage,
  MessageType,
  PeerToPeerMessage,
} from '~/types/messages';

import type { ConnectionStatus, NetworkManager } from '~/network/networkManager';

/**
 * Context object that contains all the necessary state and functions
 * that message handlers need to process messages and update the game state.
 */
export interface HandlerContext {
  /** The ID of the current player/client */
  myPlayerId?: string;

  /** Whether this client is the host of the game */
  isHost: boolean;

  /** Zustand store actions to update the game state */
  gameStore: GameStore;

  /** Network manager instance for sending messages to other players */
  networkManager: NetworkManager;

  /** Function to broadcast the current game state to all connected players */
  broadcastGameState: () => void;

  /** Callback triggered when this player is kicked from the game */
  handleKicked: (message: string) => void;

  /** Function to update the connection status in the UI */
  setConnectionStatus: (status: ConnectionStatus) => void;

  /** Function to update whether this client is the host */
  setIsHost: (isHost: boolean) => void;

  /** Session management functions */
  sessionManager: {
    saveSession: (data: Omit<SessionData, 'lastConnectionTime'>) => void;
    updateSession: (updates: Partial<Omit<SessionData, 'lastConnectionTime'>>) => void;
    clearSession: () => void;
    sessionData: SessionData | null;
  };
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
 * Validation result for message processing
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export type ValidationFunction<T extends BaseMessage = BaseMessage> = (
  message: T,
  senderId: string,
  context: HandlerContext
) => ValidationResult;

/**
 * Base handler for Client-to-Host messages.
 * These messages are sent by clients and should only be processed by the host.
 */
export type ClientToHostHandler<T extends ClientToHostMessage> = MessageHandler<T>;

/**
 * Base handler for Host-to-Client messages.
 * These messages are sent by the host and should only be processed by clients.
 */
export type HostToClientHandler<T extends HostToClientMessage> = MessageHandler<T>;

/**
 * Base handler for Peer-to-Peer messages.
 * These messages can be sent and received by any peer.
 */
export type PeerToPeerHandler<T extends PeerToPeerMessage> = MessageHandler<T>;

/**
 * Extract specific message type from GameMessage union based on the 'type' property
 */
type ExtractMessageType<T extends MessageType> = Extract<GameMessage, { type: T }>;

/**
 * Generate handler types automatically from all message types.
 * This ensures that every message type has a corresponding handler.
 * If a new message type is added to MessageType, TypeScript will require
 * a handler to be defined for it.
 */
export type MessageHandlers = {
  [K in MessageType]: MessageHandler<ExtractMessageType<K>>;
};
