import { Center } from '~/components/ui/Center';
import { Placeholder } from '~/components/ui/Placeholder';
import { Stack } from '~/components/ui/Stack';
import type { Player } from '~/types/game';

import PlayerCard from './PlayerCard';

interface RandomPlayersPanelProps {
  players: Player[];
  myPlayerId?: string;
  isHost: boolean;
  onRenamePlayer: (playerId: string, newName: string) => void;
  onKickPlayer: (playerId: string) => void;
  onDragStart: (playerId: string) => void;
}

export default function RandomPlayersPanel({
  players,
  myPlayerId,
  isHost,
  onRenamePlayer,
  onKickPlayer,
  onDragStart,
}: RandomPlayersPanelProps) {
  return (
    <Stack spacing='3'>
      <div className='text-sm text-gray-600 text-center mb-4'>
        Teams will be determined by card selection when the game starts
      </div>

      {players.length === 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Placeholder key={index}>
              <Center className='text-gray-500'>
                <span className='text-sm font-medium'>Waiting for player...</span>
              </Center>
            </Placeholder>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3'>
          {players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentUser={player.id === myPlayerId}
              isHost={isHost}
              canEdit={isHost || player.id === myPlayerId}
              canKick={isHost && player.id !== myPlayerId}
              canDrag={false} // No dragging for random teams
              onRename={onRenamePlayer}
              onKick={onKickPlayer}
              onDragStart={onDragStart}
              onKeyboardMove={undefined} // No keyboard movement for random teams
            />
          ))}
          {/* Show empty slots for remaining players */}
          {Array.from({
            length: Math.max(0, 4 - players.length),
          }).map((_, index) => (
            <Placeholder key={`empty-${index}`}>
              <Center className='text-gray-500'>
                <span className='text-sm font-medium'>Waiting for player...</span>
              </Center>
            </Placeholder>
          ))}
        </div>
      )}
    </Stack>
  );
}
