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
import { useGame } from '~/contexts/game/GameContext';

import PageContainer from '~/components/layout/PageContainer';
import { useLogger } from '~/services/loggingService';
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
  const logger = useLogger('Lobby', { gameCode: params.gameCode });
  const {
    gameState,
    isHost,
    startGame,
    connectionStatus,
    getMyPlayer,
    leaveGame,
    renamePlayer,
    renameTeam,
    kickPlayer,
    movePlayer,
    updateGameOptions,
    setPredeterminedDealer,
  } = useGame();
  const { gameCode } = params;

  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

  const myPlayer = getMyPlayer();

  logger.trace('Lobby component rendered', {
    gamePhase: gameState.phase,
    playerCount: gameState.players.length,
    isHost,
    myPlayerId: myPlayer?.id,
    connectionStatus,
  });
  const connectedPlayers = gameState.players.filter(p => p.isConnected);

  // Log lobby state changes
  useEffect(() => {
    logger.info('Lobby state updated', {
      totalPlayers: gameState.players.length,
      connectedPlayers: connectedPlayers.length,
      connectionStatus,
      isHost,
      teamSelection: gameState.options.teamSelection,
    });
  }, [
    logger,
    gameState.players.length,
    connectedPlayers.length,
    connectionStatus,
    isHost,
    gameState.options.teamSelection,
  ]);

  // Check if all requirements are met to start the game
  const canStartGame = useMemo(() => {
    if (!isHost || connectedPlayers.length !== 4) {
      return false;
    }

    // If predetermined dealer is selected, ensure a dealer is chosen
    if (gameState.options.dealerSelection === 'predetermined_first_dealer') {
      return !!gameState.options.predeterminedFirstDealerId;
    }

    return true;
  }, [
    isHost,
    connectedPlayers.length,
    gameState.options.dealerSelection,
    gameState.options.predeterminedFirstDealerId,
  ]);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      logger.warn('Connection lost, navigating to home', {
        previousConnectionStatus: connectionStatus,
      });
      navigate(`/`);
    }
  }, [connectionStatus, navigate, logger]);

  useEffect(() => {
    // Redirect to game if it has started
    if (gameState.phase !== 'lobby') {
      logger.info('Game started, navigating to game screen', {
        gamePhase: gameState.phase,
        playerCount: gameState.players.length,
      });
      navigate(`/game/${gameCode}`);
    }
  }, [gameState.phase, gameCode, navigate, logger, gameState.players.length]);

  const handleStartGame = () => {
    logger.info('Host starting game', {
      playerCount: connectedPlayers.length,
      gameOptions: gameState.options,
      canStartGame,
    });
    startGame();
  };

  const handleLeaveGame = () => {
    logger.info('Player leaving game', {
      playerId: myPlayer?.id,
      playerName: myPlayer?.name,
      isHost,
    });
    leaveGame();
  };

  const handleRenamePlayer = (playerId: string, newName: string) => {
    logger.info('Renaming player', {
      playerId,
      newName,
      isHost,
    });
    renamePlayer(playerId, newName);
  };

  const handleKickPlayer = (playerId: string) => {
    const targetPlayer = gameState.players.find(p => p.id === playerId);
    logger.warn('Kicking player', {
      targetPlayerId: playerId,
      targetPlayerName: targetPlayer?.name,
      isHost,
    });
    kickPlayer(playerId);
  };

  const handleMovePlayer = (playerId: string, newPosition: 0 | 1 | 2 | 3) => {
    const targetPlayer = gameState.players.find(p => p.id === playerId);
    logger.info('Moving player', {
      targetPlayerId: playerId,
      targetPlayerName: targetPlayer?.name,
      newPosition,
      isHost,
    });
    movePlayer(playerId, newPosition);
  };

  const handleDragStart = (playerId: string) => {
    logger.debug('Starting player drag operation', {
      playerId,
      isHost,
    });
    setDraggedPlayer(playerId);
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

        <GameCodeSharing gameId={gameCode} layout='horizontal' />
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

            {gameState.options.dealerSelection ===
              'predetermined_first_dealer' && (
              <PredeterminedDealerSelector
                players={gameState.players.filter(p => p.isConnected)}
                selectedDealerId={gameState.options.predeterminedFirstDealerId}
                onDealerSelect={setPredeterminedDealer}
                isHost={isHost}
              />
            )}

            <GameControlsPanel
              connectedPlayersCount={connectedPlayers.length}
              isHost={isHost}
              canStartGame={canStartGame}
              gameOptions={gameState.options}
              onStartGame={handleStartGame}
            />
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
