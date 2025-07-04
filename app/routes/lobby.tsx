import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import ConnectionStatusDisplay from '~/components/feedback/ConnectionStatusDisplay';
import GameCodeSharing from '~/components/lobby/GameCodeSharing';
import GameControlsPanel from '~/components/lobby/GameControlsPanel';
import GameOptionsPanel from '~/components/lobby/GameOptionsPanel';
import PlayersSection from '~/components/lobby/PlayersSection';
import Button from '~/components/ui/Button';
import Panel from '~/components/ui/Panel';
import { Stack } from '~/components/ui/Stack';
import { useGame } from '~/contexts/GameContext';

import PageContainer from '~/components/layout/PageContainer';
import type { Route } from './+types/lobby';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Game Lobby ${params.gameId} - Euchre Online` },
    {
      name: 'description',
      content: 'Waiting for players to join the Euchre game',
    },
  ];
}

export default function Lobby({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const {
    gameState,
    isHost,
    startGame,
    connectionStatus,
    getMyPlayer,
    disconnect,
    renamePlayer,
    renameTeam,
    kickPlayer,
    movePlayer,
    updateGameOptions,
  } = useGame();
  const { gameId } = params;

  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

  const myPlayer = getMyPlayer();
  const connectedPlayers = gameState.players.filter(p => p.isConnected);
  const canStartGame = isHost && connectedPlayers.length === 4;

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      navigate(`/`);
    }
  }, [connectionStatus, navigate]);

  useEffect(() => {
    // Redirect to game if it has started
    if (gameState.phase !== 'lobby') {
      navigate(`/game/${gameId}`);
    }
  }, [gameState.phase, gameId, navigate]);

  const handleStartGame = () => {
    if (canStartGame) {
      startGame();
    }
  };

  const handleLeaveGame = () => {
    disconnect();
    navigate('/');
  };

  const handleRenamePlayer = (playerId: string, newName: string) => {
    if ((isHost || playerId === myPlayer?.id) && newName.trim()) {
      renamePlayer(playerId, newName.trim());
    }
  };

  const handleKickPlayer = (playerId: string) => {
    if (isHost && playerId !== myPlayer?.id) {
      kickPlayer(playerId);
    }
  };

  const handleMovePlayer = (playerId: string, newPosition: 0 | 1 | 2 | 3) => {
    if (isHost) {
      movePlayer(playerId, newPosition);
    }
  };

  const handleDragStart = (playerId: string) => {
    if (isHost) {
      setDraggedPlayer(playerId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, position: 0 | 1 | 2 | 3) => {
    e.preventDefault();
    if (draggedPlayer && isHost) {
      handleMovePlayer(draggedPlayer, position);
      setDraggedPlayer(null);
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

        <GameCodeSharing gameId={gameId} layout='horizontal' />
      </Panel>

      {/* Main content - responsive layout */}
      <Stack spacing='6'>
        <Stack spacing='6'>
          {/* Left Column - Players (takes up 2/3 on large screens) */}
          <Stack spacing='6' className='lg:col-span-2'>
            <PlayersSection
              gameState={gameState}
              myPlayer={myPlayer}
              isHost={isHost}
              connectedPlayers={connectedPlayers}
              onRenamePlayer={handleRenamePlayer}
              onKickPlayer={handleKickPlayer}
              onRenameTeam={renameTeam}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />

            <GameOptionsPanel
              options={gameState.options}
              onOptionsChange={updateGameOptions}
              isHost={isHost}
              disabled={gameState.phase !== 'lobby'}
            />

            <GameControlsPanel
              connectedPlayersCount={connectedPlayers.length}
              isHost={isHost}
              canStartGame={canStartGame}
              onStartGame={handleStartGame}
            />
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
