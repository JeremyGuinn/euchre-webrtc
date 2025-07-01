import type { MessageHandlers } from "./types";

// Import connection handlers
import {
  handleJoinRequest,
  handleJoinResponse,
  handlePlayerJoined,
  handlePlayerLeft,
} from "./connection";

// Import gameplay handlers
import {
  handleBidMessage,
  handlePlayCardMessage,
  handleGameStateUpdate,
  handleStartGame,
  handleDealCards,
  handleSelectDealer,
  handleDrawDealerCard,
  handleCompleteDealerSelection,
} from "./gameplay";

// Import player management handlers
import {
  handleRenamePlayer,
  handleKickPlayer,
  handleMovePlayer,
} from "./player";

// Import system handlers
import {
  handleError,
  handleHeartbeat,
} from "./system";

// Re-export factory function to create message handlers
export * from "./handlersFactory";

// Re-export types and utilities
export * from "./types";

// Re-export all handlers for direct access if needed
export {
  // Connection handlers
  handleJoinRequest,
  handleJoinResponse,
  handlePlayerJoined,
  handlePlayerLeft,
  
  // Gameplay handlers
  handleStartGame,
  handleSelectDealer,
  handleDrawDealerCard,
  handleCompleteDealerSelection,
  handleBidMessage,
  handlePlayCardMessage,
  handleDealCards,
  handleGameStateUpdate,
  
  // Player management handlers
  handleRenamePlayer,
  handleKickPlayer,
  handleMovePlayer,
  
  // System handlers
  handleHeartbeat,
  handleError,
};
