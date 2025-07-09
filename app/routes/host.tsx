import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import ErrorDisplay from '~/components/error/ErrorDisplay';
import ConnectionStatusDisplay from '~/components/feedback/ConnectionStatusDisplay';
import LoadingScreen from '~/components/feedback/LoadingScreen';
import PageContainer from '~/components/layout/PageContainer';
import GameCodeSharing from '~/components/lobby/GameCodeSharing';
import Button from '~/components/ui/Button';
import { Spinner } from '~/components/ui/Spinner';
import { useGame } from '~/contexts/GameContext';

export function meta() {
  return [
    { title: 'Host Game - Euchre Online' },
    {
      name: 'description',
      content: 'Host a new Euchre game and invite friends to join',
    },
  ];
}

export default function Host() {
  const navigate = useNavigate();
  const { hostGame, connectionStatus } = useGame();
  const [gameId, setGameId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const hasHostedRef = useRef(false);

  const handleHostGame = useCallback(
    async (hostGameFn: typeof hostGame) => {
      setIsLoading(true);
      setIsRetrying(true);
      setError('');

      try {
        const gameCode = await hostGameFn();
        setGameId(gameCode);

        // Navigate to lobby
        setTimeout(() => {
          navigate(`/lobby/${gameCode}`);
        }, 2000);
      } catch {
        setError('Failed to create game. Please try again.');
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
      }
    },
    [setIsLoading, setIsRetrying, setError, setGameId, navigate]
  );

  useEffect(() => {
    if (!hasHostedRef.current) {
      hasHostedRef.current = true;
      handleHostGame(hostGame);
    }
  }, [hostGame, navigate, handleHostGame]);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingScreen title='Creating Game...' message='Setting up your Euchre table' />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className='text-center'>
        <div className='text-red-500 text-4xl mb-4'>⚠️</div>
        <h2 className='text-xl font-semibold text-gray-800 mb-2'>Error</h2>
        <ErrorDisplay error={error} className='mb-4' />
        <Button
          onClick={() => {
            hasHostedRef.current = false;
            handleHostGame(hostGame);
          }}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <div className='flex items-center'>
              <Spinner size='sm' color='white' className='mr-2' />
              Retrying...
            </div>
          ) : (
            'Try Again'
          )}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='text-center mb-6'>
        <div className='text-green-500 text-4xl mb-4'>✅</div>
        <h2 className='text-xl font-semibold text-gray-800 mb-2'>Game Created!</h2>
        <p className='text-gray-600'>Share this code with your friends</p>
      </div>

      <GameCodeSharing gameId={gameId} className='mb-6' />

      <div className='mt-6'>
        <ConnectionStatusDisplay status={connectionStatus} className='justify-between mb-4' />

        <p className='text-sm text-gray-600 text-center'>Redirecting to lobby in a moment...</p>
      </div>
    </PageContainer>
  );
}
