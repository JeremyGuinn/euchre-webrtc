import {
  handleJoinRequest,
  handleJoinResponse,
  handlePlayerJoined,
  handlePlayerLeft,
} from './connection';
import {
  handleBidMessage,
  handleCompleteBlackJackDealerSelection,
  handleDealCards,
  handleDealerCardDealt,
  handleDealerDiscard,
  handleDrawDealerCard,
  handleGameStateUpdate,
  handlePlayCardMessage,
  handleSelectDealer,
  handleStartGame,
} from './gameplay';
import {
  handleKickPlayer,
  handleMovePlayer,
  handleRenamePlayer,
  handleRenameTeam,
} from './player';
import { handleError, handleHeartbeat } from './system';
import type { MessageHandlers } from './types';

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
  DEALER_CARD_DEALT: handleDealerCardDealt,
  COMPLETE_BLACKJACK_DEALER_SELECTION: handleCompleteBlackJackDealerSelection,
  BID: handleBidMessage,
  DEALER_DISCARD: handleDealerDiscard,
  PLAY_CARD: handlePlayCardMessage,
  DEAL_CARDS: handleDealCards,
  GAME_STATE_UPDATE: handleGameStateUpdate,

  // Player management
  RENAME_PLAYER: handleRenamePlayer,
  RENAME_TEAM: handleRenameTeam,
  KICK_PLAYER: handleKickPlayer,
  MOVE_PLAYER: handleMovePlayer,

  // System
  HEARTBEAT: handleHeartbeat,
  ERROR: handleError,
});
