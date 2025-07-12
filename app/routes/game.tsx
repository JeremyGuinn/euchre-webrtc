import { useEffect } from 'react';
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
import { gameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import type { Route } from './+types/game';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Euchre Game ${params.gameCode}` },
    { name: 'description', content: 'Playing Euchre online with friends' },
  ];
}

export default function Game({ params }: Route.ComponentProps) {
  const { gameCode } = params;

  const navigate = useNavigate();
  const { connectionStatus } = useGame();
  const headerHeight = useElementHeight('#game-header');

  const phase = gameStore.use.phase();
  const myPlayer = gameStore(select.myPlayer);

  useEffect(() => {
    // Redirect to lobby if game hasn't started
    if (phase === 'lobby') {
      navigate(`/lobby/${gameCode}`);
    }
  }, [phase, gameCode, navigate]);

  const shouldShowCards = () => {
    return [
      'bidding_round1',
      'bidding_round2',
      'dealer_discard',
      'playing',
      'trick_complete',
    ].includes(phase);
  };

  if (!myPlayer) {
    return (
      <GameContainer>
        <Center className='text-white text-center min-h-screen'>
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
      <GamePhaseManager headerHeight={headerHeight} />
    </GameContainer>
  );
}
