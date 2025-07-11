import type { PositionIndex, TeamIndex } from '~/types/game';
import type { Bid, Card, Player, PublicGameState } from './game';

// Client-to-Host message types (sent by clients to the host)
export type ClientToHostMessageType =
  | 'JOIN_REQUEST'
  | 'LEAVE_GAME'
  | 'BID'
  | 'DEALER_DISCARD'
  | 'DRAW_DEALER_CARD'
  | 'FARMERS_HAND_SWAP'
  | 'FARMERS_HAND_DECLINE'
  | 'PLAY_CARD'
  | 'RENAME_PLAYER'
  | 'RENAME_TEAM'
  | 'SET_PREDETERMINED_DEALER';

// Host-to-Client message types (sent by host to clients)
export type HostToClientMessageType =
  | 'JOIN_RESPONSE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'START_GAME'
  | 'SELECT_DEALER'
  | 'DEALER_CARD_DEALT'
  | 'COMPLETE_BLACKJACK_DEALER_SELECTION'
  | 'GAME_STATE_UPDATE'
  | 'KICK_PLAYER'
  | 'MOVE_PLAYER';

// Peer-to-Peer message types (can be sent by any peer)
export type PeerToPeerMessageType = 'HEARTBEAT' | 'ERROR';

// Combined message type for backwards compatibility
export type MessageType = ClientToHostMessageType | HostToClientMessageType | PeerToPeerMessageType;

export interface BaseMessage {
  type: MessageType;
  timestamp: number;
  messageId: string;
}

export interface BaseClientToHostMessage extends BaseMessage {
  type: ClientToHostMessageType;
}

export interface BaseHostToClientMessage extends BaseMessage {
  type: HostToClientMessageType;
}

export interface BasePeerToPeerMessage extends BaseMessage {
  type: PeerToPeerMessageType;
}

// Client-to-Host Messages
export interface JoinRequestMessage extends BaseClientToHostMessage {
  type: 'JOIN_REQUEST';
  payload: {
    playerName: string;
  };
}

export interface LeaveGameMessage extends BaseClientToHostMessage {
  type: 'LEAVE_GAME';
  payload: {
    reason?: 'manual' | 'error' | 'network';
  };
}

export interface JoinResponseMessage extends BaseHostToClientMessage {
  type: 'JOIN_RESPONSE';
  payload: {
    success: boolean;
    gameState?: PublicGameState;
    player?: Player;
    error?: string;
  };
}

export interface PlayerJoinedMessage extends BaseHostToClientMessage {
  type: 'PLAYER_JOINED';
  payload: {
    player: Player;
    gameState: PublicGameState;
  };
}

export interface PlayerLeftMessage extends BaseHostToClientMessage {
  type: 'PLAYER_LEFT';
  payload: {
    playerId: string;
    gameState: PublicGameState;
  };
}

export interface StartGameMessage extends BaseHostToClientMessage {
  type: 'START_GAME';
  payload: {
    gameState: PublicGameState;
  };
}

export interface GameStateUpdateMessage extends BaseHostToClientMessage {
  type: 'GAME_STATE_UPDATE';
  payload: {
    gameState: PublicGameState;
  };
}

export interface BidMessage extends BaseClientToHostMessage {
  type: 'BID';
  payload: {
    bid: Bid;
  };
}

export interface DealerDiscardMessage extends BaseClientToHostMessage {
  type: 'DEALER_DISCARD';
  payload: {
    card: Card;
  };
}

export interface PlayCardMessage extends BaseClientToHostMessage {
  type: 'PLAY_CARD';
  payload: {
    card: Card;
  };
}

export interface HeartbeatMessage extends BasePeerToPeerMessage {
  type: 'HEARTBEAT';
  payload: {
    gameId: string;
  };
}

export interface ErrorMessage extends BasePeerToPeerMessage {
  type: 'ERROR';
  payload: {
    message: string;
    code?: string;
  };
}

export interface RenamePlayerMessage extends BaseClientToHostMessage {
  type: 'RENAME_PLAYER';
  payload: {
    newName: string;
  };
}

export interface RenameTeamMessage extends BaseClientToHostMessage {
  type: 'RENAME_TEAM';
  payload: {
    teamId: TeamIndex;
    newName: string;
  };
}

export interface KickPlayerMessage extends BaseHostToClientMessage {
  type: 'KICK_PLAYER';
  payload: {
    targetPlayerId: string;
  };
}

export interface MovePlayerMessage extends BaseHostToClientMessage {
  type: 'MOVE_PLAYER';
  payload: {
    targetPlayerId: string;
    newPosition: PositionIndex;
  };
}

export interface SelectDealerMessage extends BaseHostToClientMessage {
  type: 'SELECT_DEALER';
  payload: {
    gameState: PublicGameState;
  };
}

export interface DrawDealerCardMessage extends BaseClientToHostMessage {
  type: 'DRAW_DEALER_CARD';
  payload: {
    cardIndex?: number;
  };
}

export interface DealerCardDealtMessage extends BaseHostToClientMessage {
  type: 'DEALER_CARD_DEALT';
  payload: {
    playerId: string;
    card: Card;
    cardIndex: number;
    isBlackJack: boolean;
  };
}

export interface CompleteBlackJackDealerSelectionMessage extends BaseHostToClientMessage {
  type: 'COMPLETE_BLACKJACK_DEALER_SELECTION';
  payload: Record<string, never>;
}

export interface SetPredeterminedDealerMessage extends BaseClientToHostMessage {
  type: 'SET_PREDETERMINED_DEALER';
  payload: {
    dealerId: string;
  };
}

export interface FarmersHandSwapMessage extends BaseClientToHostMessage {
  type: 'FARMERS_HAND_SWAP';
  payload: {
    cardsToSwap: Card[];
  };
}

export interface FarmersHandDeclineMessage extends BaseClientToHostMessage {
  type: 'FARMERS_HAND_DECLINE';
  payload: Record<string, never>;
}

// Union types for each message direction
export type ClientToHostMessage =
  | JoinRequestMessage
  | LeaveGameMessage
  | BidMessage
  | DealerDiscardMessage
  | DrawDealerCardMessage
  | FarmersHandSwapMessage
  | FarmersHandDeclineMessage
  | PlayCardMessage
  | RenamePlayerMessage
  | RenameTeamMessage
  | SetPredeterminedDealerMessage;

export type HostToClientMessage =
  | JoinResponseMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | StartGameMessage
  | SelectDealerMessage
  | DealerCardDealtMessage
  | CompleteBlackJackDealerSelectionMessage
  | GameStateUpdateMessage
  | KickPlayerMessage
  | MovePlayerMessage;

export type PeerToPeerMessage = HeartbeatMessage | ErrorMessage;

// Combined union type for all messages
export type GameMessage = ClientToHostMessage | HostToClientMessage | PeerToPeerMessage;
