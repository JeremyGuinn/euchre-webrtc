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
import { useGameStore } from '~/store/gameStore';
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

  const gameStore = useGameStore();
  const myPlayer = useGameStore(select.myPlayer);
  const connectedPlayers = useGameStore(state => state.players.filter(p => p.isConnected));

  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

  // Check if all requirements are met to start the game
  const canStartGame = useMemo(() => {
    if (!myPlayer?.isHost || connectedPlayers.length !== 4) {
      return false;
    }

    // If predetermined dealer is selected, ensure a dealer is chosen
    if (gameStore.options.dealerSelection === 'predetermined_first_dealer') {
      return gameStore.options.predeterminedFirstDealerId !== undefined;
    }

    return true;
  }, [
    myPlayer?.isHost,
    connectedPlayers.length,
    gameStore.options.dealerSelection,
    gameStore.options.predeterminedFirstDealerId,
  ]);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      navigate(`/`);
    }
  }, [connectionStatus, navigate]);

  useEffect(() => {
    // Redirect to game if it has started
    if (gameStore.phase !== 'lobby') {
      navigate(`/game/${gameCode}`);
    }
  }, [gameStore.phase, gameCode, navigate, gameStore.players.length]);

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
              gameState={gameStore}
              myPlayer={myPlayer}
              isHost={myPlayer?.isHost || false}
              connectedPlayers={connectedPlayers}
              onRenamePlayer={handleRenamePlayer}
              onKickPlayer={handleKickPlayer}
              onRenameTeam={renameTeam}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />

            <GameOptionsPanel
              options={gameStore.options}
              onOptionsChange={updateGameOptions}
              isHost={myPlayer?.isHost || false}
              disabled={gameStore.phase !== 'lobby'}
            />

            {gameStore.options.dealerSelection === 'predetermined_first_dealer' && (
              <PredeterminedDealerSelector
                players={gameStore.players.filter(p => p.isConnected)}
                selectedDealerId={
                  gameStore.options.predeterminedFirstDealerId !== undefined
                    ? gameStore.players.find(
                        p => p.id === gameStore.options.predeterminedFirstDealerId
                      )?.id
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
