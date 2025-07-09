import Button from '~/components/ui/Button';
import Panel from '~/components/ui/Panel';
import type { GameOptions } from '~/types/game';

interface GameControlsPanelProps {
  connectedPlayersCount: number;
  isHost: boolean;
  canStartGame: boolean;
  gameOptions: GameOptions;
  onStartGame: () => void;
}

export default function GameControlsPanel({
  connectedPlayersCount,
  isHost,
  canStartGame,
  gameOptions,
  onStartGame,
}: GameControlsPanelProps) {
  const playersNeeded = 4 - connectedPlayersCount;

  const handleStartGame = () => {
    onStartGame();
  };

  return (
    <Panel variant='compact'>
      <div className='text-center'>
        {connectedPlayersCount < 4 ? (
          <div>
            <p className='text-gray-600 mb-4'>
              Waiting for {playersNeeded} more player
              {playersNeeded !== 1 ? 's' : ''} to join...
            </p>
            <div className='text-sm text-gray-500'>
              Share the game code or invite link with your friends
            </div>
          </div>
        ) : isHost ? (
          <div>
            {connectedPlayersCount === 4 &&
            gameOptions.dealerSelection === 'predetermined_first_dealer' &&
            gameOptions.predeterminedFirstDealerPosition === undefined ? (
              <div>
                <p className='text-yellow-600 font-medium mb-4'>
                  Please select a first dealer before starting the game.
                </p>
                <Button variant='secondary' size='lg' disabled={true}>
                  Start Game
                </Button>
              </div>
            ) : (
              <div>
                <p className='text-green-600 font-medium mb-4'>
                  All players connected! Ready to start the game.
                </p>
                <Button
                  variant='success'
                  size='lg'
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                >
                  Start Game
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className='text-green-600 font-medium'>
              All players connected! Waiting for host to start the game.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}
