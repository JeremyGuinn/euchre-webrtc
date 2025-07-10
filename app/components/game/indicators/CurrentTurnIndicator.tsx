import { useMemo } from 'react';
import { useGameUI } from '~/hooks/useGameUI';
import { useGameStore } from '~/store/gameStore';

export function CurrentTurnIndicator() {
  const gameStore = useGameStore();
  const { myPlayer } = useGameUI();

  const currentPlayer = useMemo(() => {
    return gameStore.players.find(player => player.position === gameStore.currentPlayerPosition);
  }, [gameStore.players, gameStore.currentPlayerPosition]);

  if (
    !currentPlayer ||
    !myPlayer ||
    gameStore.phase === 'dealing_animation' ||
    gameStore.phase === 'dealer_selection' ||
    gameStore.phase === 'team_summary'
  ) {
    return null;
  }

  const isMyTurn = currentPlayer.id === myPlayer.id;

  return (
    <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-center z-20'>
      <div className='bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-white/20'>
        {isMyTurn ? (
          <>
            {gameStore.phase === 'dealer_discard' && (
              <>
                <span className='font-medium text-yellow-400'>
                  {/* If they were ordered up add text */}
                  {gameStore.maker?.playerPosition !== myPlayer.position
                    ? 'You were ordered up!'
                    : 'You took it up!'}
                </span>
                <br />
              </>
            )}
            <span className='font-medium text-yellow-400'>
              {gameStore.phase === 'dealer_discard' ? `Choose a card to discard.` : 'Your turn!'}
            </span>
          </>
        ) : (
          <span>
            {gameStore.phase === 'dealer_discard'
              ? `Waiting for ${currentPlayer.name} to discard...`
              : `Waiting for ${currentPlayer.name}...`}
          </span>
        )}
      </div>
    </div>
  );
}
