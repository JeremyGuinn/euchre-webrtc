// Client-to-Host handlers
import {
  handleBidMessage,
  handleDealerDiscard,
  handleDrawDealerCard,
  handleFarmersHandDecline,
  handleFarmersHandSwap,
  handleJoinRequest,
  handlePlayCardMessage,
  handleRenamePlayer,
  handleRenameTeam,
  handleSetPredeterminedDealer,
} from './client-to-host';

// Host-to-Client handlers
import {
  handleCompleteBlackJackDealerSelection,
  handleDealerCardDealt,
  handleGameStateUpdate,
  handleJoinResponse,
  handleKickPlayer,
  handleMovePlayer,
  handlePlayerJoined,
  handlePlayerLeft,
  handleSelectDealer,
  handleStartGame,
} from './host-to-client';

// Peer-to-Peer handlers
import type { MessageHandlers } from '~/types/handlers';
import { handleError, handleHeartbeat } from './peer-to-peer';

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
  FARMERS_HAND_SWAP: handleFarmersHandSwap,
  FARMERS_HAND_DECLINE: handleFarmersHandDecline,
  GAME_STATE_UPDATE: handleGameStateUpdate,

  // Player management
  RENAME_PLAYER: handleRenamePlayer,
  RENAME_TEAM: handleRenameTeam,
  KICK_PLAYER: handleKickPlayer,
  MOVE_PLAYER: handleMovePlayer,
  SET_PREDETERMINED_DEALER: handleSetPredeterminedDealer,

  // System
  HEARTBEAT: handleHeartbeat,
  ERROR: handleError,
});
