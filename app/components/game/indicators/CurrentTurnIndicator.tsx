import type { GameState, Player } from '~/types/game';

interface CurrentTurnIndicatorProps {
  gameState: GameState;
  myPlayer: Player;
  currentPlayer?: Player;
}

export function CurrentTurnIndicator({
  gameState,
  myPlayer,
  currentPlayer,
}: CurrentTurnIndicatorProps) {
  if (
    !currentPlayer ||
    gameState.phase === 'dealing_animation' ||
    gameState.phase === 'dealer_selection' ||
    gameState.phase === 'team_summary'
  ) {
    return null;
  }

  const isMyTurn = currentPlayer.id === myPlayer.id;

  return (
    <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-center z-20'>
      <div className='bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-white/20'>
        {isMyTurn ? (
          <>
            {gameState.phase === 'dealer_discard' && (
              <>
                <span className='font-medium text-yellow-400'>
                  {/* If they were ordered up add text */}
                  {gameState.maker?.playerPosition !== myPlayer.position
                    ? 'You were ordered up!'
                    : 'You took it up!'}
                </span>
                <br />
              </>
            )}
            <span className='font-medium text-yellow-400'>
              {gameState.phase === 'dealer_discard' ? `Choose a card to discard.` : 'Your turn!'}
            </span>
          </>
        ) : (
          <span>
            {gameState.phase === 'dealer_discard'
              ? `Waiting for ${currentPlayer.name} to discard...`
              : `Waiting for ${currentPlayer.name}...`}
          </span>
        )}
      </div>
    </div>
  );
}
