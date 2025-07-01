import type { Card, Player, PublicGameState, Bid } from './game';

export type MessageType = 
  | 'JOIN_REQUEST'
  | 'JOIN_RESPONSE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'START_GAME'
  | 'GAME_STATE_UPDATE'
  | 'BID'
  | 'PLAY_CARD'
  | 'DEAL_CARDS'
  | 'HEARTBEAT'
  | 'RENAME_PLAYER'
  | 'KICK_PLAYER'
  | 'MOVE_PLAYER'
  | 'ERROR';
  
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
  messageId: string;
}

export interface JoinRequestMessage extends BaseMessage {
  type: 'JOIN_REQUEST';
  payload: {
    playerName: string;
  };
}

export interface JoinResponseMessage extends BaseMessage {
  type: 'JOIN_RESPONSE';
  payload: {
    success: boolean;
    gameState?: PublicGameState;
    player?: Player;
    error?: string;
  };
}

export interface PlayerJoinedMessage extends BaseMessage {
  type: 'PLAYER_JOINED';
  payload: {
    player: Player;
    gameState: PublicGameState;
  };
}

export interface PlayerLeftMessage extends BaseMessage {
  type: 'PLAYER_LEFT';
  payload: {
    playerId: string;
    gameState: PublicGameState;
  };
}

export interface StartGameMessage extends BaseMessage {
  type: 'START_GAME';
  payload: {
    gameState: PublicGameState;
  };
}

export interface GameStateUpdateMessage extends BaseMessage {
  type: 'GAME_STATE_UPDATE';
  payload: {
    gameState: PublicGameState;
  };
}

export interface BidMessage extends BaseMessage {
  type: 'BID';
  payload: {
    bid: Bid;
  };
}

export interface PlayCardMessage extends BaseMessage {
  type: 'PLAY_CARD';
  payload: {
    card: Card;
  };
}

export interface DealCardsMessage extends BaseMessage {
  type: 'DEAL_CARDS';
  payload: {
    hand: Card[];
    kitty: Card;
  };
}

export interface HeartbeatMessage extends BaseMessage {
  type: 'HEARTBEAT';
  payload: {
    gameId: string;
  };
}

export interface ErrorMessage extends BaseMessage {
  type: 'ERROR';
  payload: {
    message: string;
    code?: string;
  };
}

export interface RenamePlayerMessage extends BaseMessage {
  type: 'RENAME_PLAYER';
  payload: {
    newName: string;
  };
}

export interface KickPlayerMessage extends BaseMessage {
  type: 'KICK_PLAYER';
  payload: {
    targetPlayerId: string;
  };
}

export interface MovePlayerMessage extends BaseMessage {
  type: 'MOVE_PLAYER';
  payload: {
    targetPlayerId: string;
    newPosition: 0 | 1 | 2 | 3;
  };
}

export type GameMessage = 
  | JoinRequestMessage
  | JoinResponseMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | StartGameMessage
  | GameStateUpdateMessage
  | BidMessage
  | PlayCardMessage
  | DealCardsMessage
  | HeartbeatMessage
  | RenamePlayerMessage
  | KickPlayerMessage
  | MovePlayerMessage
  | ErrorMessage;
