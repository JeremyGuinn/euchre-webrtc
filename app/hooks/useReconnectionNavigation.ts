import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useGame } from '~/contexts/game/GameContext';

/**
 * Hook that handles navigation after successful reconnection
 */
export function useReconnectionNavigation() {
  const navigate = useNavigate();
  const { gameState, connectionStatus, isHost, myPlayerId } = useGame();

  useEffect(() => {
    // Only navigate if we just connected (reconnected)
    if (connectionStatus === 'connected' && gameState.id) {
      const currentPath = window.location.pathname;

      // If we're on the home page but have a valid game, navigate to the correct page
      if (currentPath === '/' || currentPath === '/home') {
        if (gameState.phase === 'lobby') {
          navigate(`/lobby/${gameState.gameCode}`, { replace: true });
        } else {
          navigate(`/game/${gameState.gameCode}`, { replace: true });
        }
      }
    }
  }, [
    connectionStatus,
    gameState.id,
    gameState.phase,
    gameState.gameCode,
    gameState.players,
    isHost,
    myPlayerId,
    navigate,
  ]);
}
