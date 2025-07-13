import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import ConnectionStatusDisplay from '~/components/feedback/ConnectionStatusDisplay';
import GameCodeSharing from '~/components/lobby/GameCodeSharing';
import GameControlsPanel from '~/components/lobby/GameControlsPanel';
import GameOptionsPanel from '~/components/lobby/GameOptionsPanel';
import PlayersSection from '~/components/lobby/PlayersSection';
import PredeterminedDealerSelector from '~/components/lobby/PredeterminedDealerSelector';
import Button from '~/components/ui/Button';
import Panel from '~/components/ui/Panel';
import { Stack } from '~/components/ui/Stack';
import { useGame } from '~/contexts/GameContext';

import PageContainer from '~/components/layout/PageContainer';
import { gameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import type { PositionIndex } from '~/types/game';
import type { Route } from './+types/lobby';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Game Lobby ${params.gameCode} - Euchre Online` },
    {
      name: 'description',
      content: 'Waiting for players to join the Euchre game',
    },
  ];
}

export default function Lobby({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const {
    connectionStatus,
    startGame,
    leaveGame,
    renamePlayer,
    renameTeam,
    kickPlayer,
    movePlayer,
    updateGameOptions,
    setPredeterminedDealer,
  } = useGame();
  const { gameCode } = params;

  const players = gameStore.use.players();
  const options = gameStore.use.options();
  const phase = gameStore.use.phase();
  const myPlayer = gameStore(select.myPlayer);

  const connectedPlayers = useMemo(() => players.filter(p => p.isConnected), [players]);

  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

  // Check if all requirements are met to start the game
  const canStartGame = useMemo(() => {
    if (!myPlayer?.isHost || connectedPlayers.length !== 4) {
      return false;
    }

    // If predetermined dealer is selected, ensure a dealer is chosen
    if (options.dealerSelection === 'predetermined_first_dealer') {
      return options.predeterminedFirstDealerId !== undefined;
    }

    return true;
  }, [
    myPlayer?.isHost,
    connectedPlayers.length,
    options.dealerSelection,
    options.predeterminedFirstDealerId,
  ]);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      if (gameCode) {
        navigate(`/join/${gameCode}`);
      } else {
        navigate(`/`);
      }
    }
  }, [connectionStatus, gameCode, navigate]);

  useEffect(() => {
    // Redirect to game if it has started
    if (phase !== 'lobby') {
      navigate(`/game/${gameCode}`);
    }
  }, [phase, gameCode, navigate, players.length]);

  const handleStartGame = () => startGame();
  const handleLeaveGame = () => leaveGame();
  const handleKickPlayer = (playerId: string) => kickPlayer(playerId);
  const handleDragStart = (playerId: string) => setDraggedPlayer(playerId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleRenamePlayer = (playerId: string, newName: string) => renamePlayer(playerId, newName);

  const handleDrop = (e: React.DragEvent, position: PositionIndex) => {
    e.preventDefault();
    if (draggedPlayer && myPlayer?.isHost) {
      movePlayer(draggedPlayer, position);
      setDraggedPlayer(null);
    }
  };

  const handleKeyboardMove = (playerId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    if (!myPlayer?.isHost) return;

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const currentPosition = player.position;
    let newPosition: PositionIndex | null = null;

    // Map movement based on team layout:
    // Team 0: positions 0, 2 (left team)
    // Team 1: positions 1, 3 (right team)
    switch (direction) {
      case 'up':
        // Move to upper position in same team
        if (currentPosition === 2) newPosition = 0; // Team 0: bottom to top
        if (currentPosition === 3) newPosition = 1; // Team 1: bottom to top
        break;
      case 'down':
        // Move to lower position in same team
        if (currentPosition === 0) newPosition = 2; // Team 0: top to bottom
        if (currentPosition === 1) newPosition = 3; // Team 1: top to bottom
        break;
      case 'left':
        // Move to corresponding position in team 0
        if (currentPosition === 1) newPosition = 0; // Top of team 1 to top of team 0
        if (currentPosition === 3) newPosition = 2; // Bottom of team 1 to bottom of team 0
        break;
      case 'right':
        // Move to corresponding position in team 1
        if (currentPosition === 0) newPosition = 1; // Top of team 0 to top of team 1
        if (currentPosition === 2) newPosition = 3; // Bottom of team 0 to bottom of team 1
        break;
    }

    if (newPosition !== null) {
      movePlayer(playerId, newPosition);
    }
  };

  return (
    <PageContainer maxWidth='full'>
      {/* Header */}
      <Panel variant='compact' className='mb-6'>
        <div className='flex justify-between items-center mb-4 flex-wrap space-y-2'>
          <h1 className='text-2xl font-bold text-gray-800'>Game Lobby</h1>
          <div className='flex items-center space-x-4 flex-wrap space-y-2'>
            <ConnectionStatusDisplay status={connectionStatus} />
            <Button variant='danger' onClick={handleLeaveGame} size='sm'>
              Leave Game
            </Button>
          </div>
        </div>

        <GameCodeSharing gameId={gameCode} layout='horizontal' />
      </Panel>

      {/* Main content - responsive layout */}
      <Stack spacing='6'>
        <Stack spacing='6'>
          {/* Left Column - Players (takes up 2/3 on large screens) */}
          <Stack spacing='6' className='lg:col-span-2'>
            <PlayersSection
              myPlayer={myPlayer}
              isHost={myPlayer?.isHost || false}
              connectedPlayers={connectedPlayers}
              onRenamePlayer={handleRenamePlayer}
              onKickPlayer={handleKickPlayer}
              onRenameTeam={renameTeam}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onKeyboardMove={handleKeyboardMove}
            />

            <GameOptionsPanel
              options={options}
              onOptionsChange={updateGameOptions}
              isHost={myPlayer?.isHost || false}
              disabled={phase !== 'lobby'}
            />

            {options.dealerSelection === 'predetermined_first_dealer' && (
              <PredeterminedDealerSelector
                players={players.filter(p => p.isConnected)}
                selectedDealerId={
                  options.predeterminedFirstDealerId !== undefined
                    ? players.find(p => p.id === options.predeterminedFirstDealerId)?.id
                    : undefined
                }
                onDealerSelect={setPredeterminedDealer}
                isHost={myPlayer?.isHost || false}
              />
            )}

            <GameControlsPanel
              connectedPlayersCount={connectedPlayers.length}
              isHost={myPlayer?.isHost || false}
              canStartGame={canStartGame}
              onStartGame={handleStartGame}
            />
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
