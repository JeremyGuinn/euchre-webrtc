import { EditableTeamName } from '~/components/forms/EditableTeamName';
import Button from '~/components/ui/Button';
import { Center } from '~/components/ui/Center';
import { Spinner } from '~/components/ui/Spinner';
import { Stack } from '~/components/ui/Stack';
import { useGame } from '~/contexts/GameContext';
import { gameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import { getSuitColor, getSuitSymbol } from '~/utils/game/cardUtils';

export function TeamSummaryOverlay() {
  const { renameTeam, proceedToDealing } = useGame();
  const teamNames = gameStore.use.teamNames();
  const players = gameStore.use.players();
  const dealerSelectionCards = gameStore.use.dealerSelectionCards();
  const options = gameStore.use.options();
  const myPlayer = gameStore(select.myPlayer);
  const currentDealer = gameStore(select.currentDealer);

  if (!myPlayer) {
    return null;
  }

  return (
    <div className='absolute inset-0 bg-black/40 z-40'>
      <div className='flex flex-col items-center justify-center h-full px-8 py-4'>
        <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[99vh] overflow-y-auto'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-gray-800 mb-2'>Team Assignments</h2>
            <p className='text-gray-600'>Here are the teams and dealer for this hand</p>
          </div>

          {/* Dealer Information */}
          <div className='text-center mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
            <div>
              <h3 className='text-lg font-semibold text-yellow-800 mb-1'>Dealer</h3>
              <p className='text-xl font-bold text-yellow-900'>
                {currentDealer?.name || 'Unknown'}
                {currentDealer === myPlayer && ' (You)'}
              </p>
              <p className='text-sm text-yellow-700 mt-1'>
                The dealer will deal the cards and has the final bidding option
              </p>
            </div>
          </div>

          {/* Teams Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            {/* Team 1 */}
            <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
              <div className='text-lg text-blue-800 mb-3 text-center'>
                <EditableTeamName
                  teamId={0}
                  teamName={teamNames.team0}
                  onRename={renameTeam}
                  disabled={
                    !myPlayer.isHost && players.find(p => p.id === myPlayer.id)?.teamId !== 0
                  }
                  className='text-blue-800'
                />
              </div>
              <Stack spacing='2'>
                {players
                  .filter(p => p.teamId === 0)
                  .sort((a, b) => a.position - b.position)
                  .map(player => (
                    <div
                      key={player.id}
                      className={`
                        p-2 rounded-md text-center font-medium
                        ${player === myPlayer ? 'bg-blue-200 text-blue-900' : 'bg-white text-blue-800'}
                        ${player === currentDealer ? 'ring-2 ring-yellow-400' : ''}
                      `}
                    >
                      {player.name}
                      {player === myPlayer && ' (You)'}
                      {player === currentDealer && ' 🃏'}
                      {/* Show the randomly selected card */}
                      {dealerSelectionCards?.[player.position] && (
                        <div className='text-sm text-gray-500'>
                          Drawn card:{' '}
                          <span
                            className={`font-medium ${getSuitColor(
                              dealerSelectionCards[player.position]!.suit
                            )}`}
                          >
                            {getSuitSymbol(dealerSelectionCards[player.position]!.suit)}{' '}
                            {dealerSelectionCards[player.position]!.value}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </Stack>
            </div>

            {/* Team 2 */}
            <div className='bg-red-50 rounded-lg p-4 border border-red-200'>
              <div className='text-lg text-red-800 mb-3 text-center'>
                <EditableTeamName
                  teamId={1}
                  teamName={teamNames.team1}
                  onRename={renameTeam}
                  disabled={
                    !myPlayer.isHost && players.find(p => p.id === myPlayer.id)?.teamId !== 1
                  }
                  className='text-red-800'
                />
              </div>
              <Stack spacing='2'>
                {players
                  .filter(p => p.teamId === 1)
                  .sort((a, b) => a.position - b.position)
                  .map(player => (
                    <div
                      key={player.id}
                      className={`
                        p-2 rounded-md text-center font-medium
                        ${player === myPlayer ? 'bg-red-200 text-red-900' : 'bg-white text-red-800'}
                        ${player === currentDealer ? 'ring-2 ring-yellow-400' : ''}
                      `}
                    >
                      {player.name}
                      {player === myPlayer && ' (You)'}
                      {player === currentDealer && ' 🃏'}
                      {dealerSelectionCards && (
                        <div className='text-sm text-gray-500'>
                          Drawn card:{' '}
                          <span
                            className={`font-medium ${getSuitColor(
                              dealerSelectionCards[player.position]!.suit
                            )}`}
                          >
                            {getSuitSymbol(dealerSelectionCards[player.position]!.suit)}{' '}
                            {dealerSelectionCards[player.position]!.value}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </Stack>
            </div>
          </div>

          {/* Team assignment explanation */}
          {options.teamSelection === 'random_cards' && (
            <div className='text-center mb-6 p-3 bg-gray-50 rounded-lg'>
              <p className='text-sm text-gray-600'>
                <span className='font-medium'>Random Teams:</span> Teams were determined by the
                cards drawn. The two players with the lowest cards form one team.
              </p>
            </div>
          )}

          {options.teamSelection === 'predetermined' && (
            <div className='text-center mb-6 p-3 bg-gray-50 rounded-lg'>
              <p className='text-sm text-gray-600'>
                <span className='font-medium'>Predetermined Teams:</span> Teams are set by seating
                position. Players sitting across from each other are teammates.
              </p>
            </div>
          )}

          {/* Continue Button */}
          <div className='text-center'>
            {myPlayer.isHost ? (
              <Button onClick={proceedToDealing} size='lg' className='px-8'>
                Deal Cards and Start Hand
              </Button>
            ) : (
              <div className='text-gray-600'>
                <Center className='inline-flex items-center space-x-2'>
                  <Spinner size='sm' color='gray' />
                  <span>Waiting for host to deal cards...</span>
                </Center>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
