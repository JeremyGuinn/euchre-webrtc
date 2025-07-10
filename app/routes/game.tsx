import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { GameHeader } from '~/components/game/GameHeader';
import { GamePhaseManager } from '~/components/game/GamePhaseManager';
import { GameTable } from '~/components/game/GameTable';
import GameContainer from '~/components/layout/GameContainer';
import { Center } from '~/components/ui/Center';
import { Spinner } from '~/components/ui/Spinner';
import { Stack } from '~/components/ui/Stack';
import { useGame } from '~/contexts/GameContext';

import { useElementHeight } from '~/hooks/useElementHeight';
import type { Route } from './+types/game';

// Auto-advance configuration
const AUTO_ADVANCE_CONFIG = {
  TRICK_COMPLETE_DELAY_MS: 1500,
  PROGRESS_UPDATE_INTERVAL_MS: 100,
  get PROGRESS_STEPS() {
    return this.TRICK_COMPLETE_DELAY_MS / this.PROGRESS_UPDATE_INTERVAL_MS;
  },
  get PROGRESS_INCREMENT() {
    return 100 / this.PROGRESS_STEPS;
  },
} as const;

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Euchre Game ${params.gameCode}` },
    { name: 'description', content: 'Playing Euchre online with friends' },
  ];
}

export default function Game({ params }: Route.ComponentProps) {
  const { gameCode } = params;
  const { gameState, isHost, connectionStatus, getMyPlayer, continueTrick } = useGame();
  const myPlayer = getMyPlayer();
  const navigate = useNavigate();
  const headerHeight = useElementHeight('#game-header');

  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);

  useEffect(() => {
    // Redirect to lobby if game hasn't started
    if (gameState.phase === 'lobby') {
      navigate(`/lobby/${gameCode}`);
    }
  }, [gameState.phase, gameCode, navigate]);

  useEffect(() => {
    // Auto-advance from trick_complete phase after 3 seconds if host
    if (gameState.phase === 'trick_complete' && isHost) {
      setAutoAdvanceProgress(0);

      const progressInterval = setInterval(() => {
        setAutoAdvanceProgress(prev => {
          const newProgress = prev + AUTO_ADVANCE_CONFIG.PROGRESS_INCREMENT;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, AUTO_ADVANCE_CONFIG.PROGRESS_UPDATE_INTERVAL_MS);

      const timer = setTimeout(() => {
        continueTrick();
      }, AUTO_ADVANCE_CONFIG.TRICK_COMPLETE_DELAY_MS);

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
        setAutoAdvanceProgress(0);
      };
    } else {
      setAutoAdvanceProgress(0);
    }
  }, [gameState.phase, isHost, continueTrick]);

  const shouldShowCards = () => {
    return [
      'bidding_round1',
      'bidding_round2',
      'dealer_discard',
      'playing',
      'trick_complete',
    ].includes(gameState.phase);
  };

  if (!myPlayer) {
    return (
      <GameContainer>
        <Center className='text-white text-center'>
          <Stack spacing='4'>
            <Center>
              <Spinner size='lg' color='white' />
            </Center>
            <p>Loading game...</p>
          </Stack>
        </Center>
      </GameContainer>
    );
  }

  return (
    <GameContainer className='relative overflow-hidden'>
      {/* Header */}
      <GameHeader />

      {/* Game Table */}
      {shouldShowCards() && (
        <GameTable headerHeight={headerHeight} shouldShowCards={shouldShowCards()} />
      )}

      {/* Connection status indicator */}
      {connectionStatus !== 'connected' && (
        <div className='fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm z-50'>
          Connection: {connectionStatus}
        </div>
      )}

      {/* Game Phase Manager - handles all overlays and phase-specific UI */}
      <GamePhaseManager headerHeight={headerHeight} autoAdvanceProgress={autoAdvanceProgress} />
    </GameContainer>
  );
}
