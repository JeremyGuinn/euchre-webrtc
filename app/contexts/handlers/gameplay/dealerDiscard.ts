import type { DealerDiscardMessage } from "../../../types/messages";
import type { MessageHandler } from "../types";

/**
 * Handles DEALER_DISCARD messages when the dealer discards a card after taking up the kitty.
 * Updates the game state to remove the discarded card from dealer's hand and start play.
 *
 * @param message - The dealer discard message containing the discarded card
 * @param senderId - The ID of the dealer who discarded the card
 * @param context - Handler context with dispatch functions
 */
export const handleDealerDiscard: MessageHandler<DealerDiscardMessage> = (
  message,
  senderId,
  context
) => {
  const { dispatch, isHost } = context;

  if (!isHost) return; // Only the host processes dealer discard messages

  // verify the sender is actually the dealer
  if (context.gameState.currentDealerId !== senderId) {
    console.warn(`Received dealer discard from non-dealer player ${senderId}`);
    return;
  }

  dispatch({
    type: "DEALER_DISCARD",
    payload: { card: message.payload.card },
  });
};
