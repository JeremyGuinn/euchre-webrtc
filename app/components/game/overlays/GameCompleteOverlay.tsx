import { useNavigate } from 'react-router';

import Button from '~/components/ui/Button';
import { Stack } from '~/components/ui/Stack';
import { useGame } from '~/contexts/GameContext';
import { gameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';

export function GameCompleteOverlay() {
  const navigate = useNavigate();
  const { leaveGame } = useGame();

  const gameCode = gameStore.use.gameCode();
  const myPlayer = gameStore(select.myPlayer);
  const players = gameStore.use.players();
  const scores = gameStore.use.scores();
  const teamNames = gameStore.use.teamNames();
  const resetGame = gameStore.use.resetGame();

  const team0Won = scores.team0 >= 10;
  const team1Won = scores.team1 >= 10;
  const winningTeam = team0Won ? 0 : 1;
  const myTeam = myPlayer?.teamId;
  const iWon = myTeam === winningTeam;

  return (
    <div className='absolute inset-0 bg-black/40 z-40'>
      <div className='flex flex-col items-center justify-center h-full p-8'>
        <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 overflow-y-auto'>
          <div className='text-center'>
            <h2 className='text-4xl font-bold text-gray-800 mb-6'>🎉 Game Complete! 🎉</h2>

            <div className='mb-8'>
              {/* Winner Announcement */}
              <div
                className={`mb-6 p-6 rounded-lg ${
                  iWon ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'
                } border-2`}
              >
                <h3
                  className={`text-2xl font-bold mb-2 ${iWon ? 'text-green-800' : 'text-gray-800'}`}
                >
                  {iWon
                    ? 'You Won!'
                    : `${
                        teamNames[`team${winningTeam}` as 'team0' | 'team1'] ||
                        `Team ${winningTeam + 1}`
                      } Wins!`}
                </h3>
                <Stack spacing='1'>
                  {players
                    .filter(p => p.teamId === winningTeam)
                    .map(player => (
                      <p
                        key={player.id}
                        className={`text-lg ${iWon ? 'text-green-700' : 'text-gray-700'}`}
                      >
                        🏆 {player.name}
                        {player.id === myPlayer?.id && ' (You)'}
                      </p>
                    ))}
                </Stack>
              </div>

              {/* Final Scores */}
              <div className='grid grid-cols-2 gap-6 mb-6'>
                <div
                  className={`text-center p-6 rounded-lg ${
                    team0Won ? 'bg-yellow-100 border-yellow-400 border-2' : 'bg-blue-50'
                  }`}
                >
                  <h3 className='text-lg font-semibold text-gray-800 mb-2'>{teamNames.team0}</h3>
                  <div
                    className={`text-4xl font-bold ${team0Won ? 'text-yellow-600' : 'text-blue-600'}`}
                  >
                    {scores.team0}
                  </div>
                  {team0Won && <div className='text-sm text-yellow-700 mt-1'>🏆 Winners!</div>}
                  <div className='mt-2'>
                    <Stack spacing='1'>
                      {players
                        .filter(p => p.teamId === 0)
                        .map(player => (
                          <div key={player.id} className='text-sm text-gray-600'>
                            {player.name}
                            {player.id === myPlayer?.id && ' (You)'}
                          </div>
                        ))}
                    </Stack>
                  </div>
                </div>

                <div
                  className={`text-center p-6 rounded-lg ${
                    team1Won ? 'bg-yellow-100 border-yellow-400 border-2' : 'bg-red-50'
                  }`}
                >
                  <h3 className='text-lg font-semibold text-gray-800 mb-2'>{teamNames.team1}</h3>
                  <div
                    className={`text-4xl font-bold ${team1Won ? 'text-yellow-600' : 'text-red-600'}`}
                  >
                    {scores.team1}
                  </div>
                  {team1Won && <div className='text-sm text-yellow-700 mt-1'>🏆 Winners!</div>}
                  <div className='mt-2'>
                    <Stack spacing='1'>
                      {players
                        .filter(p => p.teamId === 1)
                        .map(player => (
                          <div key={player.id} className='text-sm text-gray-600'>
                            {player.name}
                            {player.id === myPlayer?.id && ' (You)'}
                          </div>
                        ))}
                    </Stack>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <Stack spacing='3'>
              <Button onClick={() => leaveGame('manual')} size='lg' className='w-full'>
                Return to Home
              </Button>
              {myPlayer?.isHost && (
                <Button
                  variant='secondary'
                  size='lg'
                  className='w-full'
                  onClick={() => {
                    resetGame();
                    navigate(`/lobby/${gameCode}`);
                  }}
                >
                  Start New Game
                </Button>
              )}
            </Stack>
          </div>
        </div>
      </div>
    </div>
  );
}
