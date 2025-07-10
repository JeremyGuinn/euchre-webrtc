import Button from '~/components/ui/Button';
import { useGame } from '~/contexts/GameContext';
import { useGameStore } from '~/store/gameStore';
import { getSuitColor, getSuitSymbol } from '~/utils/game/cardUtils';

export function GameHeader() {
  const gameStore = useGameStore();
  const { leaveGame } = useGame();

  return (
    <div className='absolute top-0 left-0 right-0 bg-black/20 p-4 z-10' id='game-header'>
      <div className='flex justify-between items-center text-white'>
        <div className='flex items-center space-x-6'>
          <h1 className='text-xl font-bold'>Euchre Game</h1>

          {gameStore.trump && (
            <div className='flex items-center space-x-1'>
              <span className='text-sm'>Trump:</span>
              <span className={`text-2xl ${getSuitColor(gameStore.trump)}`}>
                {getSuitSymbol(gameStore.trump)}
              </span>
              <span className='text-sm'>{gameStore.trump}</span>
            </div>
          )}
        </div>
        <div className='flex items-center space-x-4'>
          <div className='text-sm'>
            {gameStore.teamNames.team0}: {gameStore.scores.team0} | {gameStore.teamNames.team1}:{' '}
            {gameStore.scores.team1}
          </div>
          <Button variant='danger' size='sm' onClick={() => leaveGame()}>
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
}
