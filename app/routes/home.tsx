import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import NotificationBanner from '~/components/feedback/NotificationBanner';
import Input from '~/components/forms/Input';
import PageContainer from '~/components/layout/PageContainer';
import ButtonDivider from '~/components/ui/ButtonDivider';
import LinkButton from '~/components/ui/LinkButton';
import { Stack } from '~/components/ui/Stack';
import { isValidGameCode, normalizeGameCode } from '~/utils/game/gameCode';

export function meta() {
  return [
    { title: 'Euchre Online - Play with Friends' },
    {
      name: 'description',
      content:
        'Play Euchre online with friends using peer-to-peer connections. No servers, no registration required!',
    },
  ];
}

export default function Home() {
  const [gameCode, setGameCode] = useState('');
  const location = useLocation();
  const [kickMessage, setKickMessage] = useState<string | null>(null);

  // Check for kick message from navigation state
  useEffect(() => {
    if (location.state && location.state.kickMessage) {
      setKickMessage(location.state.kickMessage);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setKickMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  return (
    <PageContainer>
      {/* Kick Message Alert */}
      {kickMessage && (
        <NotificationBanner
          message={kickMessage}
          type='error'
          onDismiss={() => setKickMessage(null)}
          className='mb-6'
        />
      )}

      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-2'>♠️ Euchre Online ♥️</h1>
        <p className='text-gray-600'>Play the classic card game with friends</p>
      </div>

      <Stack spacing='4'>
        <LinkButton to='/host' variant='primary'>
          Host a New Game
        </LinkButton>

        <ButtonDivider />

        <Stack spacing='2'>
          <Input
            placeholder='Enter game code (e.g., A3K7M2)'
            value={gameCode}
            onChange={e => {
              const normalized = normalizeGameCode(e.target.value);
              setGameCode(normalized);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && isValidGameCode(gameCode)) {
                e.preventDefault(); // Prevent form submission
                window.location.href = `/join/${gameCode}`; // Navigate to join page
              }
            }}
            className='font-mono text-center'
            maxLength={6}
            fullWidth
          />
          <LinkButton
            to={isValidGameCode(gameCode) ? `/join/${gameCode}` : '#'}
            variant='success'
            disabled={!isValidGameCode(gameCode)}
            onClick={e => {
              if (!gameCode) {
                e.preventDefault();
              }
            }}
          >
            Join Game
          </LinkButton>
        </Stack>
      </Stack>

      <div className='mt-8 text-center'>
        <Stack spacing='1' className='text-sm text-gray-600'>
          <p>🔒 No registration required</p>
          <p>🌐 Peer-to-peer connection</p>
          <p>👥 4 players needed</p>
        </Stack>
      </div>
    </PageContainer>
  );
}
