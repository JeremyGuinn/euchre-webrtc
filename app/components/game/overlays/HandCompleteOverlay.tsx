import Button from '~/components/ui/Button';
import { Center } from '~/components/ui/Center';
import { Spinner } from '~/components/ui/Spinner';
import { useGameUI } from '~/hooks/useGameUI';
import { getSuitColor, getSuitSymbol } from '~/utils/game/cardUtils';

export function HandCompleteOverlay() {
  const { gameState, myPlayer, isHost, handleCompleteHand } = useGameUI();

  if (gameState.phase !== 'hand_complete' || !myPlayer) {
    return null;
  }

  const maker = gameState.maker;
  const makerPlayer = maker
    ? gameState.players.find(p => p.position === maker.playerPosition)
    : null;
  const makerTeam = maker?.teamId;
  const handScores = gameState.handScores;

  // Count tricks won by each team
  const team0Tricks = gameState.completedTricks.filter(trick => {
    const winner = gameState.players.find(p => p.position === trick.winnerPosition);
    return winner?.teamId === 0;
  }).length;

  const team1Tricks = gameState.completedTricks.filter(trick => {
    const winner = gameState.players.find(p => p.position === trick.winnerPosition);
    return winner?.teamId === 1;
  }).length;

  const makerTeamTricks = makerTeam === 0 ? team0Tricks : team1Tricks;
  const madeBid = makerTeamTricks >= 3;

  return (
    <div className='absolute inset-0 bg-black/40 z-40'>
      <div className='flex flex-col items-center justify-center h-full p-8'>
        <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 overflow-y-auto'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold text-gray-800 mb-6'>Hand Complete!</h2>

            <div className='mb-6'>
              {/* Trump and Maker Info */}
              <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
                <Center className='space-x-4 mb-2'>
                  <span className='text-sm text-gray-600'>Trump:</span>
                  {gameState.trump && (
                    <span className={`text-xl ${getSuitColor(gameState.trump)}`}>
                      {getSuitSymbol(gameState.trump)} {gameState.trump}
                    </span>
                  )}
                </Center>
                {makerPlayer && (
                  <p className='text-sm text-gray-700'>
                    <span className='font-medium'>{makerPlayer.name}</span>
                    {makerPlayer.id === myPlayer.id && ' (You)'} called trump
                    {maker?.alone && ' and went alone'}
                  </p>
                )}
              </div>

              {/* Tricks Won */}
              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div
                  className={`p-4 rounded-lg ${
                    makerTeam === 0 ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100'
                  }`}
                >
                  <h3 className='font-semibold text-gray-800 mb-1'>{gameState.teamNames.team0}</h3>
                  <div className='text-2xl font-bold text-blue-600'>{team0Tricks}</div>
                  <div className='text-xs text-gray-600'>tricks won</div>
                </div>
                <div
                  className={`p-4 rounded-lg ${makerTeam === 1 ? 'bg-red-100 border-2 border-red-300' : 'bg-gray-100'}`}
                >
                  <h3 className='font-semibold text-gray-800 mb-1'>{gameState.teamNames.team1}</h3>
                  <div className='text-2xl font-bold text-red-600'>{team1Tricks}</div>
                  <div className='text-xs text-gray-600'>tricks won</div>
                </div>
              </div>

              {/* Hand Result */}
              <div className='mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                {madeBid ? (
                  <div>
                    <p className='text-lg font-semibold text-green-700 mb-2'>
                      {makerTeamTricks === 5 ? 'Sweep!' : 'Bid Made!'}
                    </p>
                    <p className='text-sm text-gray-700'>
                      {gameState.teamNames[`team${makerTeam!}` as 'team0' | 'team1'] ||
                        `Team ${makerTeam! + 1}`}{' '}
                      made their bid with {makerTeamTricks} trick
                      {makerTeamTricks !== 1 ? 's' : ''}
                      {makerTeamTricks === 5 && maker?.alone && ' (going alone)'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className='text-lg font-semibold text-red-700 mb-2'>Euchred!</p>
                    <p className='text-sm text-gray-700'>
                      {gameState.teamNames[`team${makerTeam!}` as 'team0' | 'team1'] ||
                        `Team ${makerTeam! + 1}`}{' '}
                      only won {makerTeamTricks} trick
                      {makerTeamTricks !== 1 ? 's' : ''} - other team gets 2 points
                    </p>
                  </div>
                )}
              </div>

              {/* Points Awarded */}
              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div className='text-center'>
                  <div
                    className={`text-3xl font-bold ${handScores.team0 > 0 ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    +{handScores.team0}
                  </div>
                  <div className='text-sm text-gray-600'>{gameState.teamNames.team0} Points</div>
                </div>
                <div className='text-center'>
                  <div
                    className={`text-3xl font-bold ${handScores.team1 > 0 ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    +{handScores.team1}
                  </div>
                  <div className='text-sm text-gray-600'>{gameState.teamNames.team1} Points</div>
                </div>
              </div>

              {/* Total Scores */}
              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div className='text-center p-3 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>{gameState.scores.team0}</div>
                  <div className='text-sm text-gray-600'>{gameState.teamNames.team0} Total</div>
                </div>
                <div className='text-center p-3 bg-red-50 rounded-lg'>
                  <div className='text-2xl font-bold text-red-600'>{gameState.scores.team1}</div>
                  <div className='text-sm text-gray-600'>{gameState.teamNames.team1} Total</div>
                </div>
              </div>
            </div>

            {isHost ? (
              <Button onClick={handleCompleteHand} size='lg' className='w-full'>
                {gameState.scores.team0 >= 10 || gameState.scores.team1 >= 10
                  ? 'End Game'
                  : 'Start Next Hand'}
              </Button>
            ) : (
              <div className='text-gray-600'>
                <div className='inline-flex items-center space-x-2'>
                  <Spinner size='sm' color='gray' />
                  <span>Waiting for host...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
