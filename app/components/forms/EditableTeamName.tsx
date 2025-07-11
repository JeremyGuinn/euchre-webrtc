import { useState } from 'react';
import type { TeamIndex } from '~/types/game';
import Input from './Input';

interface EditableTeamNameProps {
  teamId: TeamIndex;
  teamName: string;
  onRename: (teamId: TeamIndex, newName: string) => void;
  disabled?: boolean;
  className?: string;
}

export function EditableTeamName({
  teamId,
  teamName,
  onRename,
  disabled = false,
  className = '',
}: EditableTeamNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(teamName);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(teamName);
  };

  const handleSave = () => {
    const trimmedName = editValue.trim();
    if (trimmedName && trimmedName !== teamName) {
      onRename(teamId, trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(teamName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className='flex items-center space-x-2'>
        <Input
          type='text'
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          maxLength={50}
          fullWidth
          className='flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-semibold bg-white'
        />
        <div className='flex space-x-1'>
          <button
            onClick={handleSave}
            disabled={!editValue.trim()}
            className='p-1.5 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
            className='p-1.5 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors'
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
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      disabled={disabled}
      className={`group flex items-center space-x-1 ${!disabled ? 'px-2 py-1 transition-colors' : ''} ${className}`}
      title={!disabled ? 'Click to rename team' : ''}
    >
      <span className='font-semibold'>{teamName}</span>
      {!disabled && (
        <svg
          className='w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity'
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
      )}
    </button>
  );
}
