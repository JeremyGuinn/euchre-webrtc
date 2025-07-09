import Button from '~/components/ui/Button';
import type { GameState } from '~/types/game';

interface GameHeaderProps {
  gameState: GameState;
  suitSymbols: Record<string, string>;
  suitColors: Record<string, string>;
  onLeaveGame: () => void;
}

export function GameHeader({ gameState, suitSymbols, suitColors, onLeaveGame }: GameHeaderProps) {
  return (
    <div className='absolute top-0 left-0 right-0 bg-black/20 p-4 z-10' id='game-header'>
      <div className='flex justify-between items-center text-white'>
        <div className='flex items-center space-x-6'>
          <h1 className='text-xl font-bold'>Euchre Game</h1>

          {gameState.trump && (
            <div className='flex items-center space-x-1'>
              <span className='text-sm'>Trump:</span>
              <span className={`text-lg ${suitColors[gameState.trump]}`}>
                {suitSymbols[gameState.trump]}
              </span>
            </div>
          )}
        </div>
        <div className='flex items-center space-x-4'>
          <div className='text-sm'>
            {gameState.teamNames.team0}: {gameState.scores.team0} | {gameState.teamNames.team1}:{' '}
            {gameState.scores.team1}
          </div>
          <Button variant='danger' size='sm' onClick={onLeaveGame}>
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
}
