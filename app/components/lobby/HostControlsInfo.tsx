import { IconContainer } from '~/components/ui/IconContainer';
import { Stack } from '~/components/ui/Stack';

interface HostControlsInfoProps {
  isHost: boolean;
}

export function HostControlsInfo({ isHost }: HostControlsInfoProps) {
  if (!isHost) {
    return (
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm'>
        <div className='flex items-start space-x-3'>
          <div className='flex-shrink-0'>
            <IconContainer variant='blue'>
              <svg
                className='w-4 h-4 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
            </IconContainer>
          </div>
          <div>
            <h3 className='text-sm font-semibold text-blue-900 mb-1'>Player Controls</h3>
            <p className='text-sm text-blue-700'>Hover over your name to edit it</p>
            <p className='text-sm text-blue-700'>Hover over your team name to edit it</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5 shadow-sm'>
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0'>
          <IconContainer variant='amber'>
            <svg className='w-4 h-4 text-amber-600' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'
                clipRule='evenodd'
              />
            </svg>
          </IconContainer>
        </div>
        <div className='flex-1'>
          <h3 className='text-sm font-semibold text-amber-900 mb-2'>Host Controls</h3>
          <Stack spacing='2'>
            <div className='flex items-center space-x-2 text-sm text-amber-800'>
              <IconContainer size='sm' variant='white'>
                <svg
                  className='w-3 h-3 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
              </IconContainer>
              <span>Hover over any player to rename them</span>
            </div>
            <div className='flex items-center space-x-2 text-sm text-amber-800'>
              <IconContainer size='sm' variant='white'>
                <svg
                  className='w-3 h-3 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </IconContainer>
              <span>Hover over any player to remove them</span>
            </div>
            <div className='flex items-center space-x-2 text-sm text-amber-800'>
              <IconContainer size='sm' variant='white'>
                <svg className='w-3 h-3 text-gray-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 000 2h6a1 1 0 100-2H7z' />
                </svg>
              </IconContainer>
              <span>Drag and drop players to reorganize teams</span>
            </div>
            <div className='flex items-center space-x-2 text-sm text-amber-800'>
              <IconContainer size='sm' variant='white'>
                <svg
                  className='w-3 h-3 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
              </IconContainer>
              <span>Hover over any team name to rename them</span>
            </div>
          </Stack>
        </div>
      </div>
    </div>
  );
}

export default HostControlsInfo;
