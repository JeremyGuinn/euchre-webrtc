import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import NotificationBanner from '~/components/feedback/NotificationBanner';
import ReconnectionScreen from '~/components/feedback/ReconnectionScreen';
import Input from '~/components/forms/Input';
import PageContainer from '~/components/layout/PageContainer';
import ButtonDivider from '~/components/ui/ButtonDivider';
import LinkButton from '~/components/ui/LinkButton';
import { Stack } from '~/components/ui/Stack';
import { useGame } from '~/contexts/game/GameContext';
import { useReconnectionNavigation } from '~/hooks/useReconnectionNavigation';
import { SessionStorageService } from '~/services/sessionService';
import { isValidGameCode, normalizeGameCode } from '~/utils/gameCode';
import { shouldAttemptAutoReconnection } from '~/utils/reconnection';

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
  const { connectionStatus, reconnectionStatus } = useGame();

  // Handle automatic reconnection and navigation
  useReconnectionNavigation();

  // Helper function to determine if we should show reconnection screen
  const shouldShowReconnectionScreen = () => {
    // Always show if we're in a reconnecting/connecting state
    if (
      connectionStatus === 'reconnecting' ||
      connectionStatus === 'connecting'
    ) {
      return true;
    }

    // Also show if we have retry status active
    if (reconnectionStatus.isReconnecting) {
      return true;
    }

    // Show if we have a valid session that should trigger auto-reconnection
    // This catches cases where the component renders before connection status is set
    const session = SessionStorageService.getSession();
    if (session && shouldAttemptAutoReconnection(session)) {
      return true;
    }

    return false;
  };

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

  // Show reconnection screen if we're reconnecting to prevent flash of home page content
  if (shouldShowReconnectionScreen()) {
    return (
      <PageContainer>
        <ReconnectionScreen reconnectionStatus={reconnectionStatus} />
      </PageContainer>
    );
  }

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
        <h1 className='text-3xl font-bold text-gray-800 mb-2'>
          ♠️ Euchre Online ♥️
        </h1>
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
