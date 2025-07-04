import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import ErrorDisplay from '~/components/error/ErrorDisplay';
import ConnectionStatusDisplay from '~/components/feedback/ConnectionStatusDisplay';
import LoadingScreen from '~/components/feedback/LoadingScreen';
import PageContainer from '~/components/layout/PageContainer';
import GameCodeSharing from '~/components/lobby/GameCodeSharing';
import Button from '~/components/ui/Button';
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
        const newGameId = await hostGameFn();
        setGameId(newGameId);

        // Navigate to lobby
        setTimeout(() => {
          navigate(`/lobby/${newGameId}`);
        }, 2000);
      } catch (err) {
        console.error('Failed to host game:', err);
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
        <LoadingScreen
          title='Creating Game...'
          message='Setting up your Euchre table'
        />
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
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
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
        <h2 className='text-xl font-semibold text-gray-800 mb-2'>
          Game Created!
        </h2>
        <p className='text-gray-600'>Share this code with your friends</p>
      </div>

      <GameCodeSharing gameId={gameId} className='mb-6' />

      <div className='mt-6'>
        <ConnectionStatusDisplay
          status={connectionStatus}
          className='justify-between mb-4'
        />

        <p className='text-sm text-gray-600 text-center'>
          Redirecting to lobby in a moment...
        </p>
      </div>
    </PageContainer>
  );
}
