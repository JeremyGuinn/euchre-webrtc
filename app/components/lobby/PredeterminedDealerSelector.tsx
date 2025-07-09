import Button from '~/components/ui/Button';
import Panel from '~/components/ui/Panel';
import type { Player } from '~/types/game';

interface PredeterminedDealerSelectorProps {
  players: Player[];
  selectedDealerId?: string;
  onDealerSelect: (playerId: string) => void;
  isHost: boolean;
}

export default function PredeterminedDealerSelector({
  players,
  selectedDealerId,
  onDealerSelect,
  isHost,
}: PredeterminedDealerSelectorProps) {
  if (!isHost) {
    const selectedPlayer = players.find(p => p.id === selectedDealerId);
    return (
      <Panel variant='compact' shadow='md'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold text-gray-800 mb-2'>First Dealer</h3>
          {selectedPlayer ? (
            <p className='text-gray-600'>
              <span className='font-medium'>{selectedPlayer.name}</span> will be the first dealer
            </p>
          ) : (
            <p className='text-gray-500'>Host is selecting the first dealer...</p>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <Panel variant='compact' shadow='md'>
      <h3 className='text-lg font-semibold text-gray-800 mb-4'>Select First Dealer</h3>
      <div className='flex gap-2 flex-wrap'>
        {players.map(player => (
          <Button
            key={player.id}
            onClick={() => onDealerSelect(player.id)}
            variant={selectedDealerId === player.id ? 'primary' : 'secondary'}
            className='flex-1 min-w-0 justify-center'
          >
            <div className='flex flex-row items-center justify-between'>
              <div className='text-xs font-medium truncate max-w-full'>{player.name}</div>
              {selectedDealerId === player.id && (
                <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </div>
          </Button>
        ))}
      </div>
      {selectedDealerId && (
        <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
          <p className='text-sm text-blue-700'>
            <strong>{players.find(p => p.id === selectedDealerId)?.name}</strong> will be the first
            dealer when the game starts.
          </p>
        </div>
      )}
    </Panel>
  );
}
