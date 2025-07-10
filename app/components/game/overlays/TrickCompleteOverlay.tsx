import { useEffect } from 'react';
import Button from '~/components/ui/Button';
import { Spinner } from '~/components/ui/Spinner';
import { useGame } from '~/contexts/GameContext';
import { useAutoAdvance } from '~/hooks/useAutoAdvance';
import { useGameUI } from '~/hooks/useGameUI';
import { getSuitColor, getSuitSymbol } from '~/utils/game/cardUtils';
import { Card } from '../Card';

export function TrickCompleteOverlay() {
  const { continueTrick } = useGame();
  const { gameState, myPlayer, isHost, handleContinueTrick } = useGameUI();

  // Auto-advance for trick_complete phase
  const { trigger, cancel, progress } = useAutoAdvance(continueTrick, {
    enabled: gameState.phase === 'trick_complete' && isHost,
    delayMs: 1500, // 1.5 seconds
  });

  useEffect(() => {
    // Trigger auto-advance when entering trick_complete phase as host
    if (gameState.phase === 'trick_complete' && isHost) {
      trigger();
    } else {
      cancel();
    }
  }, [gameState.phase, isHost, trigger, cancel]);

  const lastTrick = gameState.completedTricks[gameState.completedTricks.length - 1];
  const winner = lastTrick
    ? gameState.players.find(p => p.position === lastTrick.winnerPosition)
    : null;
  const winningCard = lastTrick?.cards.find(
    playedCard => playedCard.playerPosition === lastTrick.winnerPosition
  );

  return (
    <div className='absolute inset-0 bg-black/40 z-40'>
      <div className='flex flex-col items-center justify-center h-full p-8'>
        <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 overflow-y-auto'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>Trick Complete!</h2>

            <div className='mb-6'>
              {winner && winningCard && (
                <>
                  <p className='text-lg text-gray-700 mb-3'>
                    <span className='font-semibold text-blue-600'>{winner.name}</span>
                    {winner.id === myPlayer?.id && ' (You)'} won the trick!
                  </p>

                  <div className='flex justify-center mb-4'>
                    <Card card={winningCard.card} size='medium' />
                  </div>

                  <p className='text-sm text-gray-600 mb-2'>
                    Winning card:{' '}
                    <span className={`font-medium ${getSuitColor(winningCard.card.suit)}`}>
                      {getSuitSymbol(winningCard.card.suit)} {winningCard.card.value}
                    </span>
                  </p>

                  <div className='text-xs text-gray-500'>
                    Tricks completed: {gameState.completedTricks.length} / 5
                  </div>
                </>
              )}
            </div>

            {isHost ? (
              <div className='relative'>
                <Button
                  onClick={handleContinueTrick}
                  size='lg'
                  className='w-full relative overflow-hidden'
                >
                  {/* Progress background */}
                  <div
                    className='absolute inset-0 bg-white/20 transition-all duration-100 ease-linear'
                    style={{
                      width: `${progress}%`,
                      transformOrigin: 'left',
                    }}
                  />

                  {/* Button text */}
                  <span className='relative z-10'>Continue to Next Trick</span>
                </Button>
              </div>
            ) : (
              <div className='text-gray-600'>
                <div className='inline-flex items-center space-x-2'>
                  <Spinner size='sm' color='gray' />
                  <span>Waiting for host to continue...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
