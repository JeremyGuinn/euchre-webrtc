import { gameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';

export function CurrentTurnIndicator() {
  const phase = gameStore.use.phase();
  const maker = gameStore.use.maker();
  const myPlayer = gameStore(select.myPlayer);
  const currentPlayer = gameStore(select.currentPlayer);

  return (
    <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-center z-20'>
      <div className='bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-white/20'>
        {currentPlayer === myPlayer ? (
          <>
            {phase === 'dealer_discard' && (
              <>
                <span className='font-medium text-yellow-400'>
                  {/* If they were ordered up add text */}
                  {maker?.playerPosition !== myPlayer?.position
                    ? 'You were ordered up!'
                    : 'You took it up!'}
                </span>
                <br />
              </>
            )}
            <span className='font-medium text-yellow-400'>
              {phase === 'dealer_discard' ? `Choose a card to discard.` : 'Your turn!'}
            </span>
          </>
        ) : (
          <span>
            {phase === 'dealer_discard'
              ? `Waiting for ${currentPlayer?.name} to discard...`
              : `Waiting for ${currentPlayer?.name}...`}
          </span>
        )}
      </div>
    </div>
  );
}
