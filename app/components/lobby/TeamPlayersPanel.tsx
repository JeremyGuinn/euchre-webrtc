import { EditableTeamName } from '~/components/forms/EditableTeamName';
import PlayerCard from '~/components/lobby/PlayerCard';
import { Center } from '~/components/ui/Center';
import { Placeholder } from '~/components/ui/Placeholder';
import { Stack } from '~/components/ui/Stack';
import type { Player } from '~/types/game';

interface TeamPlayersPanelProps {
  players: Player[];
  teamNames: { team0: string; team1: string };
  myPlayerId?: string;
  isHost: boolean;
  onRenamePlayer: (playerId: string, newName: string) => void;
  onRenameTeam: (teamId: 0 | 1, newName: string) => void;
  onKickPlayer: (playerId: string) => void;
  onDragStart: (playerId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, position: 0 | 1 | 2 | 3) => void;
}

export function TeamPlayersPanel({
  players,
  teamNames,
  myPlayerId,
  isHost,
  onRenamePlayer,
  onRenameTeam,
  onKickPlayer,
  onDragStart,
  onDragOver,
  onDrop,
}: TeamPlayersPanelProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {/* Team 0 */}
      <div className='bg-blue-50 rounded-lg p-4'>
        <div className='text-blue-800 mb-3 text-center'>
          <EditableTeamName
            teamId={0}
            teamName={teamNames.team0}
            onRename={onRenameTeam}
            disabled={
              !isHost && players.find(p => p.id === myPlayerId)?.teamId !== 0
            }
            className='font-medium'
          />
        </div>
        <Stack spacing='2'>
          {[0, 2].map(position => {
            const player = players.find(p => p.position === position);

            if (player) {
              return (
                <div
                  key={position}
                  className={player.isConnected ? '' : 'opacity-75'}
                >
                  <PlayerCard
                    player={player}
                    isCurrentUser={player.id === myPlayerId}
                    isHost={isHost}
                    canEdit={isHost || player.id === myPlayerId}
                    canKick={isHost && player.id !== myPlayerId}
                    canDrag={isHost && player.id !== myPlayerId}
                    onRename={onRenamePlayer}
                    onKick={onKickPlayer}
                    onDragStart={onDragStart}
                  />
                </div>
              );
            }

            // Empty slot - use div without interactive behavior since drag-and-drop is visual only
            return (
              <div
                key={position}
                className='border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400'
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, position as 0 | 1 | 2 | 3)}
              >
                <Placeholder>
                  <Center className='text-gray-500'>
                    <span className='text-sm font-medium'>
                      Waiting for player...
                    </span>
                  </Center>
                </Placeholder>
              </div>
            );
          })}
        </Stack>
      </div>

      {/* Team 1 */}
      <div className='bg-red-50 rounded-lg p-4'>
        <div className='text-red-800 mb-3 text-center'>
          <EditableTeamName
            teamId={1}
            teamName={teamNames.team1}
            onRename={onRenameTeam}
            disabled={
              !isHost && players.find(p => p.id === myPlayerId)?.teamId !== 1
            }
            className='font-medium'
          />
        </div>
        <Stack spacing='2'>
          {[1, 3].map(position => {
            const player = players.find(p => p.position === position);
            return (
              <div
                key={position}
                role={isHost && !player ? 'button' : undefined}
                tabIndex={isHost && !player ? 0 : undefined}
                aria-label={
                  isHost && !player
                    ? `Drop zone for position ${position + 1} in team 2`
                    : undefined
                }
                className={`transition-all ${
                  player
                    ? player.isConnected
                      ? ''
                      : 'opacity-75'
                    : 'border-dashed border-gray-300 bg-gray-50'
                } ${isHost && !player ? 'hover:border-red-400' : ''}`}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, position as 0 | 1 | 2 | 3)}
              >
                {player ? (
                  <PlayerCard
                    player={player}
                    isCurrentUser={player.id === myPlayerId}
                    isHost={isHost}
                    canEdit={isHost || player.id === myPlayerId}
                    canKick={isHost && player.id !== myPlayerId}
                    canDrag={isHost && player.id !== myPlayerId}
                    onRename={onRenamePlayer}
                    onKick={onKickPlayer}
                    onDragStart={onDragStart}
                  />
                ) : (
                  <Placeholder>
                    <Center className='text-gray-500'>
                      <span className='text-sm font-medium'>
                        Waiting for player...
                      </span>
                    </Center>
                  </Placeholder>
                )}
              </div>
            );
          })}
        </Stack>
      </div>
    </div>
  );
}
