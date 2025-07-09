import { useEffect, useState } from 'react';
import type { ReconnectionStatus } from '~/types/gameContext';
import Button from '../ui/Button';
import { Center } from '../ui/Center';
import { Spinner } from '../ui/Spinner';
import { Stack } from '../ui/Stack';

interface ReconnectionScreenProps {
  reconnectionStatus: ReconnectionStatus;
  className?: string;
  onCancel?: () => void;
}

export default function ReconnectionScreen({
  reconnectionStatus,
  className = '',
  onCancel,
}: ReconnectionScreenProps) {
  const [dots, setDots] = useState('');

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    if (!reconnectionStatus.isReconnecting) {
      return 'Reconnecting';
    }
    return `Reconnecting (Attempt ${reconnectionStatus.attempt}/${reconnectionStatus.maxRetries})`;
  };

  const getMessage = () => {
    if (!reconnectionStatus.isReconnecting) {
      return 'Attempting to reconnect to your game...';
    }

    const baseMessage = reconnectionStatus.reason || 'Connection failed';
    return `${baseMessage}. Retrying in a moment...`;
  };

  return (
    <Center className={`text-center ${className}`}>
      <Stack spacing='3'>
        <Center>
          <Spinner size='lg' />
        </Center>

        <div>
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>
            {getTitle()}
            {dots}
          </h2>
          <p className='text-gray-600 mb-4'>{getMessage()}</p>

          {reconnectionStatus.isReconnecting && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm'>
              <div className='flex items-center justify-center text-yellow-800'>
                <svg className='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                Having trouble reconnecting
              </div>
              {reconnectionStatus.reason === 'Game ID conflict detected' && (
                <p className='mt-2 text-yellow-700'>
                  Your original game code may be taken. We&apos;ll generate a new one if needed.
                </p>
              )}
            </div>
          )}

          {onCancel && (
            <div className='mt-4'>
              <Button onClick={onCancel} variant='secondary' size='sm'>
                Cancel Reconnection
              </Button>
            </div>
          )}
        </div>
      </Stack>
    </Center>
  );
}
