import Button from '~/components/ui/Button';
import { Spinner } from '~/components/ui/Spinner';
import type { GameState, Player } from '~/types/game';
import { Card } from '../Card';

interface TrickCompleteOverlayProps {
  gameState: GameState;
  myPlayer: Player;
  isHost: boolean;
  autoAdvanceProgress: number;
  suitSymbols: Record<string, string>;
  suitColors: Record<string, string>;
  onContinueTrick: () => void;
}

export function TrickCompleteOverlay({
  gameState,
  myPlayer,
  isHost,
  autoAdvanceProgress,
  suitSymbols,
  suitColors,
  onContinueTrick,
}: TrickCompleteOverlayProps) {
  if (gameState.phase !== 'trick_complete') {
    return null;
  }

  const lastTrick =
    gameState.completedTricks[gameState.completedTricks.length - 1];
  const winner = lastTrick
    ? gameState.players.find(p => p.id === lastTrick.winnerId)
    : null;
  const winningCard = lastTrick?.cards.find(
    playedCard => playedCard.playerId === lastTrick.winnerId
  );

  return (
    <div className='absolute inset-0 bg-black/40 z-40'>
      <div className='flex flex-col items-center justify-center h-full p-8'>
        <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 overflow-y-auto'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>
              Trick Complete!
            </h2>

            <div className='mb-6'>
              {winner && winningCard && (
                <>
                  <p className='text-lg text-gray-700 mb-3'>
                    <span className='font-semibold text-blue-600'>
                      {winner.name}
                    </span>
                    {winner.id === myPlayer.id && ' (You)'} won the trick!
                  </p>

                  <div className='flex justify-center mb-4'>
                    <Card card={winningCard.card} size='medium' />
                  </div>

                  <p className='text-sm text-gray-600 mb-2'>
                    Winning card:{' '}
                    <span
                      className={`font-medium ${suitColors[winningCard.card.suit]}`}
                    >
                      {suitSymbols[winningCard.card.suit]}{' '}
                      {winningCard.card.value}
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
                  onClick={onContinueTrick}
                  size='lg'
                  className='w-full relative overflow-hidden'
                >
                  {/* Progress background */}
                  <div
                    className='absolute inset-0 bg-white/20 transition-all duration-100 ease-linear'
                    style={{
                      width: `${autoAdvanceProgress}%`,
                      transformOrigin: 'left',
                    }}
                  />

                  {/* Button text */}
                  <span className='relative z-10'>
                    Continue to Next Trick
                    {autoAdvanceProgress > 0 && (
                      <span className='ml-2 text-sm opacity-80'>
                        ({Math.ceil(((100 - autoAdvanceProgress) / 100) * 3)}s)
                      </span>
                    )}
                  </span>
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
