import { useState } from 'react';
import Button from '~/components/ui/Button';
import type { GameState, Player } from '~/types/game';

interface PlayerManagementMenuProps {
  player: Player;
  gameState: GameState;
  isMyPlayer: boolean;
  isHost: boolean;
  onKickPlayer: (playerId: string) => void;
  onClose: () => void;
}

export function PlayerManagementMenu({
  player,
  gameState,
  isMyPlayer,
  isHost,
  onKickPlayer,
  onClose,
}: PlayerManagementMenuProps) {
  const [showConfirmKick, setShowConfirmKick] = useState(false);

  const handleKickPlayer = () => {
    onKickPlayer(player.id);
    onClose();
  };

  const handleKickClick = () => {
    setShowConfirmKick(true);
  };

  const handleCancelKick = () => {
    setShowConfirmKick(false);
  };

  // Don't show menu for the current player or if not host
  if (isMyPlayer || !isHost) {
    return null;
  }

  // Check if kicking is allowed in current game phase
  const criticalPhases = ['playing', 'trick_complete'];
  const isCriticalPhase = criticalPhases.includes(gameState.phase);

  return (
    <div className='bg-white rounded-lg shadow-lg border p-2 min-w-[200px]'>
      {!showConfirmKick ? (
        <div className='space-y-1'>
          <div className='px-2 py-1 text-sm font-medium text-gray-700 border-b'>
            Manage {player.name}
          </div>
          {!player.isConnected && (
            <div className='px-2 py-1 text-xs text-orange-600 bg-orange-50 rounded'>
              Player is disconnected
            </div>
          )}
          {isCriticalPhase && (
            <div className='px-2 py-1 text-xs text-yellow-600 bg-yellow-50 rounded'>
              ⚠️ Removing during active play may disrupt the game
            </div>
          )}
          <Button
            onClick={handleKickClick}
            variant='danger'
            size='sm'
            fullWidth
            className='text-left justify-start'
          >
            Remove Player
          </Button>
          <Button
            onClick={onClose}
            variant='secondary'
            size='sm'
            fullWidth
            className='text-left justify-start'
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className='space-y-2'>
          <div className='px-2 py-1 text-sm text-gray-700'>
            Remove <strong>{player.name}</strong> from the game?
          </div>
          <div className='text-xs text-gray-500 px-2'>
            {player.isConnected
              ? 'They will be disconnected and can rejoin if needed.'
              : 'This will permanently remove the disconnected player.'}
          </div>
          {isCriticalPhase && (
            <div className='text-xs text-red-600 px-2 bg-red-50 rounded p-1'>
              ⚠️ Warning: This may disrupt the current hand or trick.
            </div>
          )}
          <div className='flex gap-2'>
            <Button onClick={handleKickPlayer} variant='danger' size='sm' className='flex-1'>
              Remove
            </Button>
            <Button onClick={handleCancelKick} variant='secondary' size='sm' className='flex-1'>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
