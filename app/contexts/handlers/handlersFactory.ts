import { handleJoinRequest, handleJoinResponse, handlePlayerJoined, handlePlayerLeft } from "./connection";
import { handleStartGame, handleBidMessage, handlePlayCardMessage, handleDealCards, handleGameStateUpdate } from "./gameplay";
import { handleRenamePlayer, handleKickPlayer, handleMovePlayer } from "./player";
import { handleHeartbeat, handleError } from "./system";
import type { MessageHandlers } from "./types";

export const createMessageHandlers = (): MessageHandlers => ({
  // Connection management
  JOIN_REQUEST: handleJoinRequest,
  JOIN_RESPONSE: handleJoinResponse,
  PLAYER_JOINED: handlePlayerJoined,
  PLAYER_LEFT: handlePlayerLeft,
  
  // Gameplay
  START_GAME: handleStartGame,
  BID: handleBidMessage,
  PLAY_CARD: handlePlayCardMessage,
  DEAL_CARDS: handleDealCards,
  GAME_STATE_UPDATE: handleGameStateUpdate,
  
  // Player management
  RENAME_PLAYER: handleRenamePlayer,
  KICK_PLAYER: handleKickPlayer,
  MOVE_PLAYER: handleMovePlayer,
  
  // System
  HEARTBEAT: handleHeartbeat,
  ERROR: handleError,
});