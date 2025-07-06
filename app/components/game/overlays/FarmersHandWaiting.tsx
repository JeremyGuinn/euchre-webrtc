import { Spinner } from '~/components/ui/Spinner';
import type { Player } from '~/types/game';

interface FarmersHandWaitingProps {
  farmersHandPlayer: Player;
}

export function FarmersHandWaiting({
  farmersHandPlayer,
}: FarmersHandWaitingProps) {
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-40'>
      <div className='bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl'>
        <div className='mb-4'>
          <Spinner size='lg' />
        </div>

        <h3 className='text-xl font-semibold text-gray-800 mb-2'>
          Farmer&apos;s Hand Detected!
        </h3>

        <p className='text-gray-600 mb-4'>
          <strong>{farmersHandPlayer.name}</strong> has all 9s and 10s and is
          deciding whether to swap cards with the kitty.
        </p>

        <p className='text-sm text-gray-500'>
          Please wait for their decision...
        </p>
      </div>
    </div>
  );
}
