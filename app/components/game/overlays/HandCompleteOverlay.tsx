import Button from '~/components/ui/Button';
import { Center } from '~/components/ui/Center';
import { Spinner } from '~/components/ui/Spinner';
import { useGame } from '~/contexts/GameContext';
import { useGameStore } from '~/store/gameStore';
import { select as playerSelectors } from '~/store/selectors/players';
import { select as teamSelectors } from '~/store/selectors/teams';
import { getSuitColor, getSuitSymbol } from '~/utils/game/cardUtils';

export function HandCompleteOverlay() {
  const { completeHand } = useGame();
  const { handScores, maker, phase, trump, teamNames, scores } = useGameStore();
  const myPlayer = useGameStore(playerSelectors.myPlayer);
  const currentMakerPlayer = useGameStore(playerSelectors.currentMakerPlayer);
  const team0Score = useGameStore(teamSelectors.teamScore(0));
  const team1Score = useGameStore(teamSelectors.teamScore(1));

  if (phase !== 'hand_complete') {
    return null;
  }

  const makerTeamTricks = maker?.teamId === 0 ? team0Score : team1Score;
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
                  {trump && (
                    <span className={`text-xl ${getSuitColor(trump)}`}>
                      {getSuitSymbol(trump)} {trump}
                    </span>
                  )}
                </Center>
                {currentMakerPlayer && (
                  <p className='text-sm text-gray-700'>
                    <span className='font-medium'>{currentMakerPlayer.name}</span>
                    {currentMakerPlayer.id === myPlayer?.id && ' (You)'} called trump
                    {maker?.alone && ' and went alone'}
                  </p>
                )}
              </div>

              {/* Tricks Won */}
              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div
                  className={`p-4 rounded-lg ${
                    maker?.teamId === 0 ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100'
                  }`}
                >
                  <h3 className='font-semibold text-gray-800 mb-1'>{teamNames.team0}</h3>
                  <div className='text-2xl font-bold text-blue-600'>{team0Score}</div>
                  <div className='text-xs text-gray-600'>tricks won</div>
                </div>
                <div
                  className={`p-4 rounded-lg ${maker?.teamId === 1 ? 'bg-red-100 border-2 border-red-300' : 'bg-gray-100'}`}
                >
                  <h3 className='font-semibold text-gray-800 mb-1'>{teamNames.team1}</h3>
                  <div className='text-2xl font-bold text-red-600'>{team1Score}</div>
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
                      {teamNames[`team${maker?.teamId}` as 'team0' | 'team1']} made their bid with{' '}
                      {makerTeamTricks} trick
                      {makerTeamTricks !== 1 ? 's' : ''}
                      {makerTeamTricks === 5 && maker?.alone && ' (going alone)'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className='text-lg font-semibold text-red-700 mb-2'>Euchred!</p>
                    <p className='text-sm text-gray-700'>
                      {teamNames[`team${maker?.teamId}` as 'team0' | 'team1']} only won{' '}
                      {makerTeamTricks} trick
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
                  <div className='text-sm text-gray-600'>{teamNames.team0} Points</div>
                </div>
                <div className='text-center'>
                  <div
                    className={`text-3xl font-bold ${handScores.team1 > 0 ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    +{handScores.team1}
                  </div>
                  <div className='text-sm text-gray-600'>{teamNames.team1} Points</div>
                </div>
              </div>

              {/* Total Scores */}
              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div className='text-center p-3 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>{scores.team0}</div>
                  <div className='text-sm text-gray-600'>{teamNames.team0} Total</div>
                </div>
                <div className='text-center p-3 bg-red-50 rounded-lg'>
                  <div className='text-2xl font-bold text-red-600'>{scores.team1}</div>
                  <div className='text-sm text-gray-600'>{teamNames.team1} Total</div>
                </div>
              </div>
            </div>

            {myPlayer?.isHost ? (
              <Button onClick={() => completeHand()} size='lg' className='w-full'>
                {scores.team0 >= 10 || scores.team1 >= 10 ? 'End Game' : 'Start Next Hand'}
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
