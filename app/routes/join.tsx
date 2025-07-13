import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import ErrorDisplay from '~/components/error/ErrorDisplay';
import ConnectionStatusDisplay from '~/components/feedback/ConnectionStatusDisplay';
import Input from '~/components/forms/Input';
import PageContainer from '~/components/layout/PageContainer';
import Button from '~/components/ui/Button';
import LinkButton from '~/components/ui/LinkButton';
import { Stack } from '~/components/ui/Stack';
import { useGame } from '~/contexts/GameContext';
import { useSession } from '~/contexts/SessionContext';
import { isValidGameCode, normalizeGameCode } from '~/utils/game/gameCode';

import { gameStore } from '~/store/gameStore';
import type { Route } from './+types/join';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Join Game ${params.gameCode} - Euchre Online` },
    { name: 'description', content: 'Join a Euchre game with friends' },
  ];
}

export default function Join({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { joinGame, connectionStatus, currentError, clearError } = useGame();
  const { playerName: savedPlayerName, savePlayerName } = useSession();
  const gameCode = normalizeGameCode(params.gameCode || '');

  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const id = gameStore.use.id();

  // Clear any existing error from context when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    // Validate the game code
    if (!isValidGameCode(gameCode)) {
      setError('Invalid game code. Please check the code and try again.');
      return;
    }

    if (savedPlayerName) {
      setPlayerName(savedPlayerName);
    }
  }, [gameCode, savedPlayerName]);

  // Handle connection status changes
  useEffect(() => {
    // If we successfully connect, navigate to lobby and replace the join entry in history
    // so that back button from lobby goes to home instead of join
    if (connectionStatus === 'connected' && id) {
      navigate(`/lobby/${gameCode}`, { replace: true });
    }

    // If connection fails or errors out, show error
    if (connectionStatus === 'error') {
      setIsJoining(false);
    }
  }, [connectionStatus, navigate, gameCode, id]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError('');
    clearError(); // Clear any previous network errors

    try {
      savePlayerName(playerName.trim());
      await joinGame(gameCode, playerName.trim());

      // Navigation to lobby will be handled by the useEffect watching connectionStatus
    } catch (error) {
      // If there's no specific error from the context (currentError), use the error from the exception
      if (!currentError) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to join game. Please check the game code and try again.';
        setError(errorMessage);
      }
      setIsJoining(false);
    }
  };

  return (
    <PageContainer>
      <div className='text-center mb-8'>
        <h1 className='text-2xl font-bold text-gray-800 mb-2'>Join Game</h1>
        <p className='text-gray-600'>
          Game Code: <span className='font-mono font-semibold'>{gameCode}</span>
        </p>
      </div>

      <form onSubmit={handleJoinGame}>
        <Stack spacing='6'>
          <Input
            label='Your Name'
            id='playerName'
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder='Enter your name'
            maxLength={20}
            required
            disabled={isJoining}
            fullWidth
          />

          {/* Display either context error or local error */}
          {(currentError || error) && <ErrorDisplay error={currentError?.message || error} />}

          <ConnectionStatusDisplay status={connectionStatus} className='justify-between mb-4' />

          <Button
            type='submit'
            variant='success'
            size='lg'
            fullWidth
            disabled={!playerName.trim()}
            loading={isJoining && !currentError}
          >
            {isJoining && !currentError ? 'Joining...' : 'Join Game'}
          </Button>
        </Stack>
      </form>

      <div className='mt-6 text-center'>
        <LinkButton to='/' variant='text' size='sm'>
          ← Back to Home
        </LinkButton>
      </div>
    </PageContainer>
  );
}
