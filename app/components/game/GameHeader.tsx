import Button from '~/components/ui/Button';
import { useGame } from '~/contexts/GameContext';
import { useGameStore } from '~/store/gameStore';
import { getSuitColor, getSuitSymbol } from '~/utils/game/cardUtils';

export function GameHeader() {
  const { trump, teamNames, scores } = useGameStore();
  const { leaveGame } = useGame();

  return (
    <div className='absolute top-0 left-0 right-0 bg-black/20 p-4 z-10' id='game-header'>
      <div className='flex justify-between items-center text-white'>
        <div className='flex items-center space-x-6'>
          <h1 className='text-xl font-bold'>Euchre Game</h1>

          {trump && (
            <div className='flex items-center space-x-1'>
              <span className='text-sm'>Trump:</span>
              <span className={`text-2xl ${getSuitColor(trump)}`}>{getSuitSymbol(trump)}</span>
              <span className='text-sm'>{trump}</span>
            </div>
          )}
        </div>
        <div className='flex items-center space-x-4'>
          <div className='text-sm'>
            {teamNames.team0}: {scores.team0} | {teamNames.team1}: {scores.team1}
          </div>
          <Button variant='danger' size='sm' onClick={() => leaveGame()}>
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
}
