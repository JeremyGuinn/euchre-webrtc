import { handleJoinRequest, handleJoinResponse, handlePlayerJoined, handlePlayerLeft } from "./connection";
import { 
  handleStartGame, 
  handleSelectDealer,
  handleDrawDealerCard,
  handleCompleteDealerSelection,
  handleBidMessage, 
  handleDealerDiscard,
  handlePlayCardMessage, 
  handleDealCards, 
  handleGameStateUpdate 
} from "./gameplay";
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
  SELECT_DEALER: handleSelectDealer,
  DRAW_DEALER_CARD: handleDrawDealerCard,
  COMPLETE_DEALER_SELECTION: handleCompleteDealerSelection,
  BID: handleBidMessage,
  DEALER_DISCARD: handleDealerDiscard,
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