import type { KickPlayerMessage } from "../../../types/messages";
import type { MessageHandler } from "../types";

/**
 * Handles KICK_PLAYER messages sent by the host to remove a player from the game.
 * All players receive these messages to update their local player list.
 * The kicked player will also disconnect and be redirected.
 * 
 * @param message - The kick player message containing the target player ID
 * @param senderId - The ID of the host who kicked the player
 * @param context - Handler context with game state, player ID, and connection functions
 */
export const handleKickPlayer: MessageHandler<KickPlayerMessage> = (message, senderId, context) => {
  const { 
    gameState, 
    myPlayerId, 
    dispatch, 
    networkManager, 
    onKicked, 
    setConnectionStatus, 
    setMyPlayerId, 
    setIsHost 
  } = context;
  
  const { targetPlayerId } = message.payload;

  // Security: Only host can kick players
  const senderPlayer = gameState.players.find(p => p.id === senderId);
  if (!senderPlayer?.isHost) {
    console.warn(`Non-host player ${senderId} attempted to kick player ${targetPlayerId}`);
    return;
  }

  dispatch({
    type: "KICK_PLAYER",
    payload: { playerId: targetPlayerId }
  });

  // If the kicked player is me, disconnect and notify
  if (targetPlayerId === myPlayerId) {
    networkManager?.disconnect();
    setConnectionStatus("disconnected");
    setMyPlayerId("");
    setIsHost(false);
    
    // Clear session storage when kicked
    sessionStorage.removeItem("euchre-player-id");
    sessionStorage.removeItem("euchre-game-id");
    
    // Call the onKicked callback to handle the redirect
    if (onKicked) {
      onKicked("You have been removed from the game by the host.");
    }
  }
};
