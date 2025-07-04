import Panel from '~/components/ui/Panel';
import { Stack } from '~/components/ui/Stack';
import type { GameState, Player } from '~/types/game';

import HostControlsInfo from './HostControlsInfo';
import RandomPlayersPanel from './RandomPlayersPanel';
import { TeamPlayersPanel } from './TeamPlayersPanel';

interface PlayersSectionProps {
  gameState: GameState;
  myPlayer?: Player;
  isHost: boolean;
  connectedPlayers: Player[];
  onRenamePlayer: (playerId: string, newName: string) => void;
  onKickPlayer: (playerId: string) => void;
  onRenameTeam: (teamId: 0 | 1, newName: string) => void;
  onDragStart: (playerId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, position: 0 | 1 | 2 | 3) => void;
}

export default function PlayersSection({
  gameState,
  myPlayer,
  isHost,
  connectedPlayers,
  onRenamePlayer,
  onKickPlayer,
  onRenameTeam,
  onDragStart,
  onDragOver,
  onDrop,
}: PlayersSectionProps) {
  return (
    <Panel variant='compact'>
      <h2 className='text-xl font-semibold text-gray-800 mb-4'>
        Players ({connectedPlayers.length}/4)
      </h2>

      <Stack spacing='3'>
        {gameState.options?.teamSelection === 'predetermined' ? (
          <TeamPlayersPanel
            players={gameState.players}
            teamNames={gameState.teamNames}
            myPlayerId={myPlayer?.id}
            isHost={isHost}
            onRenamePlayer={onRenamePlayer}
            onKickPlayer={onKickPlayer}
            onRenameTeam={onRenameTeam}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
          />
        ) : (
          <RandomPlayersPanel
            players={gameState.players}
            myPlayerId={myPlayer?.id}
            isHost={isHost}
            onRenamePlayer={onRenamePlayer}
            onKickPlayer={onKickPlayer}
            onDragStart={onDragStart}
          />
        )}

        {/* Host Controls Info */}
        <HostControlsInfo isHost={isHost} />
      </Stack>
    </Panel>
  );
}
