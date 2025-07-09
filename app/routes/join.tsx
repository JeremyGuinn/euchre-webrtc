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
import { isValidGameCode, normalizeGameCode } from '~/utils/gameCode';

import type { Route } from './+types/join';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Join Game ${params.gameCode} - Euchre Online` },
    { name: 'description', content: 'Join a Euchre game with friends' },
  ];
}

export default function Join({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { joinGame, connectionStatus } = useGame();
  const { playerName: savedPlayerName, savePlayerName } = useSession();
  const gameCode = normalizeGameCode(params.gameCode || '');

  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

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
    // If we successfully connect, navigate to lobby
    if (connectionStatus === 'connected') {
      navigate(`/lobby/${gameCode}`);
    }
    // If connection fails or errors out, show error
    if (connectionStatus === 'error') {
      setError('Connection failed. Please try again.');
      setIsJoining(false);
    }
  }, [connectionStatus, navigate, gameCode]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      savePlayerName(playerName.trim());
      await joinGame(gameCode, playerName.trim());

      // Navigation to lobby will be handled by the useEffect watching connectionStatus
    } catch {
      setError(
        'Failed to join game. Please check the game code and try again.'
      );
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

          {error && <ErrorDisplay error={error} />}

          <ConnectionStatusDisplay
            status={connectionStatus}
            className='justify-between mb-4'
          />

          <Button
            type='submit'
            variant='success'
            size='lg'
            fullWidth
            disabled={!playerName.trim()}
            loading={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Game'}
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
