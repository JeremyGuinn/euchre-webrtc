import Panel from '~/components/ui/Panel';
import { Stack } from '~/components/ui/Stack';
import type { Player } from '~/types/game';

import { useGameStore } from '~/store/gameStore';
import type { PositionIndex, TeamIndex } from '~/types/game';
import HostControlsInfo from './HostControlsInfo';
import RandomPlayersPanel from './RandomPlayersPanel';
import { TeamPlayersPanel } from './TeamPlayersPanel';

interface PlayersSectionProps {
  myPlayer?: Player;
  isHost: boolean;
  connectedPlayers: Player[];
  onRenamePlayer: (playerId: string, newName: string) => void;
  onKickPlayer: (playerId: string) => void;
  onRenameTeam: (teamId: TeamIndex, newName: string) => void;
  onDragStart: (playerId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, position: PositionIndex) => void;
}

export default function PlayersSection({
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
  const players = useGameStore(state => state.players);
  const options = useGameStore(state => state.options);
  const teamNames = useGameStore(state => state.teamNames);

  return (
    <Panel variant='compact'>
      <h2 className='text-xl font-semibold text-gray-800 mb-4'>
        Players ({connectedPlayers.length}/4)
      </h2>

      <Stack spacing='3'>
        {options?.teamSelection === 'predetermined' ? (
          <TeamPlayersPanel
            players={players}
            teamNames={teamNames}
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
            players={players}
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
