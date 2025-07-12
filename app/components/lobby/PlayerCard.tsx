import { useState } from 'react';

import { cn } from '~/utils/styling/cn';
import Input from '../forms/Input';

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    isHost: boolean;
    isConnected: boolean;
  };
  isCurrentUser: boolean;
  isHost: boolean;
  canEdit: boolean;
  canKick: boolean;
  canDrag: boolean;
  onRename: (playerId: string, newName: string) => void;
  onKick: (playerId: string) => void;
  onDragStart?: (playerId: string) => void;
  onKeyboardMove?: (playerId: string, direction: 'up' | 'down' | 'left' | 'right') => void;
}

export function PlayerCard({
  player,
  isCurrentUser,
  canEdit,
  canKick,
  canDrag,
  onRename,
  onKick,
  onDragStart,
  onKeyboardMove,
}: PlayerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(player.name);

  const handleStartEdit = () => {
    setIsEditing(true);
    setNewName(player.name);
  };

  const handleSave = () => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      return;
    }

    if (trimmedName === player.name) {
      setIsEditing(false);
      return;
    }

    onRename(player.id, trimmedName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewName(player.name);
  };

  const handleKick = () => onKick(player.id);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (!canDrag || !onKeyboardMove) return;

    // Allow reordering with keyboard: Arrow keys to move between positions
    if (e.altKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();

      const direction = e.key.replace('Arrow', '').toLowerCase() as
        | 'up'
        | 'down'
        | 'left'
        | 'right';
      onKeyboardMove(player.id, direction);
    }
  };

  return (
    <div
      className={cn(
        'group relative p-4 rounded-lg border-2 transition-all duration-200',
        player.isConnected
          ? 'bg-white border-gray-200 hover:border-gray-300'
          : 'bg-gray-50 border-gray-300 opacity-75',
        canDrag && 'cursor-move hover:shadow-md pl-10'
      )}
      draggable={canDrag}
      onDragStart={() => onDragStart?.(player.id)}
      onKeyDown={handleCardKeyDown}
      tabIndex={canDrag ? 0 : -1}
      role={canDrag ? 'button' : undefined}
      aria-label={
        canDrag
          ? `${player.name}${isCurrentUser ? ' (You)' : ''}${player.isHost ? ', Host' : ''}. Press Alt+Arrow keys to move to different position.`
          : undefined
      }
      aria-describedby={canDrag ? `player-move-instructions-${player.id}` : undefined}
    >
      {/* Drag indicator */}
      {canDrag && (
        <div className='absolute left-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity'>
          <svg
            className='w-4 h-4 text-gray-400'
            fill='currentColor'
            viewBox='0 0 20 20'
            aria-hidden='true'
          >
            <path d='M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 000 2h6a1 1 0 100-2H7z' />
          </svg>
        </div>
      )}

      {/* Hidden instructions for screen readers */}
      {canDrag && (
        <div id={`player-move-instructions-${player.id}`} className='sr-only'>
          Use Alt+Arrow keys to move this player to a different position. Arrow up/down moves
          between teams, left/right moves within team.
        </div>
      )}

      <div className='flex items-center justify-between'>
        <div className='flex-1 min-w-0'>
          {isEditing ? (
            <div className='flex items-center space-x-2'>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                className='flex-1 text-sm'
                maxLength={20}
                placeholder='Enter name...'
                fullWidth
              />
              <div className='flex space-x-1'>
                <button
                  onClick={handleSave}
                  disabled={!newName.trim()}
                  className='p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  title='Save'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </button>
                <button
                  onClick={handleCancel}
                  className='p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                  title='Cancel'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className='flex items-center space-x-2'>
              <span className='font-medium text-gray-900 truncate'>
                {player.name}
                {isCurrentUser && (
                  <span className='ml-1 text-sm text-gray-500 font-normal'>(You)</span>
                )}
              </span>
              {canEdit && (
                <button
                  onClick={handleStartEdit}
                  className='opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all'
                  title={isCurrentUser ? 'Edit your name' : 'Rename player'}
                >
                  <svg
                    className='w-3.5 h-3.5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        <div className='flex items-center space-x-3'>
          {/* Host badge */}
          {player.isHost && (
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
              <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'
                  clipRule='evenodd'
                />
              </svg>
              Host
            </span>
          )}

          {/* Kick button */}
          {canKick && !isEditing && (
            <button
              onClick={handleKick}
              className='opacity-0 group-hover:opacity-100 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all'
              title='Remove player'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
            </button>
          )}

          {/* Connection status */}
          <div
            className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={player.isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
      </div>
    </div>
  );
}

export default PlayerCard;
