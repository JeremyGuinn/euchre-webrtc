import { useCallback } from 'react';
import { useGame } from '~/contexts/GameContext';
import { useSession } from '~/contexts/SessionContext';
import type { Card, Player } from '~/types/game';
import { getSuitColor, getSuitSymbol } from '~/utils/game/cardUtils';
import {
  getCircularPosition,
  getPositionAngle,
  getRelativePlayerPosition,
} from '~/utils/game/playerPositionUtils';

/**
 * Custom hook that provides game UI context and utilities
 * This helps eliminate prop drilling by centralizing game-related data and actions
 */
export function useGameUI() {
  const gameContext = useGame();
  const sessionContext = useSession();

  // Get current player info from session and game context
  const myPlayer = gameContext.getMyPlayer();
  const isHost = sessionContext.sessionData?.isHost ?? false;

  // Card utility functions
  const getCardDisplay = useCallback((card: Card) => {
    return {
      symbol: getSuitSymbol(card.suit),
      colorClass: getSuitColor(card.suit),
      value: card.value,
    };
  }, []);

  // Player identification helpers
  const isMyPlayer = useCallback(
    (player: Player) => {
      return player.id === gameContext.myPlayerId;
    },
    [gameContext.myPlayerId]
  );

  const isCurrentDealer = useCallback(
    (player: Player) => {
      return player.position === gameContext.gameState.currentDealerPosition;
    },
    [gameContext.gameState.currentDealerPosition]
  );

  // Game actions with proper context
  const handleRenameTeam = useCallback(
    (teamId: 0 | 1, newName: string) => {
      gameContext.renameTeam(teamId, newName);
    },
    [gameContext]
  );

  const handleProceedToDealing = useCallback(() => {
    gameContext.proceedToDealing();
  }, [gameContext]);

  const handleCompleteHand = useCallback(() => {
    gameContext.completeHand();
  }, [gameContext]);

  const handleContinueTrick = useCallback(() => {
    gameContext.continueTrick();
  }, [gameContext]);

  // Card actions
  const handlePlayCard = useCallback(
    (card: Card) => {
      gameContext.playCard(card);
    },
    [gameContext]
  );

  const handleDealerDiscard = useCallback(
    (card: Card) => {
      gameContext.dealerDiscard(card);
    },
    [gameContext]
  );

  // Player position utilities
  const getPlayerPosition = useCallback(
    (player: Player) => {
      if (!myPlayer) return 'bottom';
      return getRelativePlayerPosition(player, myPlayer.position);
    },
    [myPlayer]
  );

  const getPlayerAngle = useCallback(
    (player: Player) => {
      const position = getPlayerPosition(player);
      return getPositionAngle(position);
    },
    [getPlayerPosition]
  );

  const getPlayerCircularPosition = useCallback(
    (player: Player, radius: number) => {
      const angle = getPlayerAngle(player);
      return getCircularPosition(angle, radius);
    },
    [getPlayerAngle]
  );

  // Game state utilities
  const getCurrentPlayer = useCallback(() => {
    return gameContext.gameState.players.find(
      (p: Player) => p.position === gameContext.gameState.currentPlayerPosition
    );
  }, [gameContext.gameState.players, gameContext.gameState.currentPlayerPosition]);

  const getCurrentDealer = useCallback(() => {
    return gameContext.gameState.players.find(
      (p: Player) => p.position === gameContext.gameState.currentDealerPosition
    );
  }, [gameContext.gameState.players, gameContext.gameState.currentDealerPosition]);

  const getMyHand = useCallback(() => {
    return gameContext.getMyHand();
  }, [gameContext]);

  return {
    // Player context
    myPlayer,
    isHost,
    myPlayerId: gameContext.myPlayerId,

    // Game state
    gameState: gameContext.gameState,

    // Utility functions
    getCardDisplay,
    isMyPlayer,
    isCurrentDealer,
    getPlayerPosition,
    getPlayerAngle,
    getPlayerCircularPosition,
    getCurrentPlayer,
    getCurrentDealer,
    getMyHand,

    // Game state checks
    canPlay: gameContext.canPlay,
    isMyTurn: gameContext.isMyTurn,
    isSittingOut: gameContext.isSittingOut,

    // Actions
    handleRenameTeam,
    handleProceedToDealing,
    handleCompleteHand,
    handleContinueTrick,
    handlePlayCard,
    handleDealerDiscard,

    // Connection status
    connectionStatus: gameContext.connectionStatus,
    isReconnecting: gameContext.reconnectionStatus.isReconnecting,
  };
}
