import { DealerSelectionAnimation } from '~/components/game/dealer-selection/DealerSelectionAnimation';
import { DealingAnimation } from '~/components/game/DealingAnimation';
import { BiddingInterface } from '~/components/game/interfaces/BiddingInterface';
import { FarmersHandInterface } from '~/components/game/overlays/FarmersHandInterface';
import { FarmersHandWaiting } from '~/components/game/overlays/FarmersHandWaiting';
import { GameCompleteOverlay } from '~/components/game/overlays/GameCompleteOverlay';
import { HandCompleteOverlay } from '~/components/game/overlays/HandCompleteOverlay';
import { TeamSummaryOverlay } from '~/components/game/overlays/TeamSummaryOverlay';
import { TrickCompleteOverlay } from '~/components/game/overlays/TrickCompleteOverlay';
import Button from '~/components/ui/Button';
import { Center } from '~/components/ui/Center';
import { useGame } from '~/contexts/GameContext';
import { useGameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';

interface GamePhaseManagerProps {
  headerHeight: number;
}

export function GamePhaseManager({ headerHeight }: GamePhaseManagerProps) {
  const {
    phase,
    dealerSelectionCards,
    firstBlackJackDealing,
    options,
    kitty,
    farmersHandPosition,
  } = useGameStore();
  const { selectDealer } = useGame();
  const myPlayer = useGameStore(select.myPlayer);
  const currentPlayerPosition = useGameStore(state => state.currentPlayerPosition);

  const isMyTurn = () => {
    return myPlayer?.position === currentPlayerPosition;
  };

  // Dealer Selection Animation
  if (phase === 'dealer_selection') {
    if (!dealerSelectionCards && !firstBlackJackDealing) {
      // Initial state - show instruction overlay
      return (
        <Center className='absolute inset-0 bg-black/60 z-40'>
          <div className='text-white text-center p-8 bg-black/40 rounded-lg backdrop-blur-sm border border-white/20'>
            <h2 className='text-3xl font-bold mb-4'>
              {options.dealerSelection === 'random_cards' &&
              options.teamSelection === 'random_cards'
                ? 'Dealer and Team Selection'
                : 'Dealer Selection'}
            </h2>
            <p className='text-lg mb-4'>
              {options.dealerSelection === 'random_cards' &&
                options.teamSelection === 'predetermined' &&
                'Each player will draw a card to determine the dealer.'}
              {options.dealerSelection === 'random_cards' &&
                options.teamSelection === 'random_cards' &&
                'Each player will draw a card to determine the dealer and teams.'}
              {options.dealerSelection === 'first_black_jack' &&
                options.teamSelection === 'predetermined' &&
                'The player with the first Black Jack will be the dealer.'}
              {options.dealerSelection === 'first_black_jack' &&
                options.teamSelection === 'random_cards' &&
                'The player with the first Black Jack will be the dealer, and the two players with the lowest cards will form one team.'}
              {options.dealerSelection === 'predetermined_first_dealer' &&
                'The predetermined dealer has been selected and the game will continue.'}
            </p>
            {options.teamSelection === 'random_cards' &&
              options.dealerSelection === 'random_cards' && (
                <p className='text-sm text-gray-300 mb-6'>
                  The two players with the lowest cards will form one team.
                  <br />
                  The player with the lowest card will be the dealer.
                </p>
              )}

            {myPlayer?.isHost ? (
              <Button onClick={() => selectDealer()} size='lg'>
                {options.dealerSelection === 'random_cards'
                  ? 'Start Card Drawing'
                  : options.dealerSelection === 'first_black_jack'
                    ? 'Find First Black Jack'
                    : 'Continue Game'}
              </Button>
            ) : (
              <div className='text-gray-400'>Waiting for host to start...</div>
            )}
          </div>
        </Center>
      );
    } else {
      return (
        <div
          className='relative w-full'
          style={{
            height: `calc(100vh - ${headerHeight}px)`,
            top: `${headerHeight}px`,
          }}
        >
          <DealerSelectionAnimation />
        </div>
      );
    }
  }

  // Team Summary - Show dealer and team assignments
  if (phase === 'team_summary') {
    return <TeamSummaryOverlay />;
  }

  // Dealing Animation
  if (phase === 'dealing_animation') {
    return (
      <div
        className='relative w-full'
        style={{
          height: `calc(100vh - ${headerHeight}px)`,
          top: `${headerHeight}px`,
        }}
      >
        <DealingAnimation />
      </div>
    );
  }

  // Bidding Interface - positioned below player's hand
  if (((phase === 'bidding_round1' && kitty) || phase === 'bidding_round2') && isMyTurn()) {
    return <BiddingInterface />;
  }

  // Trick Complete - Show winner and continue
  if (phase === 'trick_complete') {
    return <TrickCompleteOverlay />;
  }

  // Hand Complete - Show hand results
  if (phase === 'hand_complete') {
    return <HandCompleteOverlay />;
  }

  // Farmer's Hand Interface - Allow player to swap cards
  if (phase === 'farmers_hand_swap') {
    if (farmersHandPosition === myPlayer?.position) {
      return <FarmersHandInterface />;
    } else if (farmersHandPosition) {
      return <FarmersHandWaiting />;
    }
  }

  // Game Complete - Show final results
  if (phase === 'game_complete') {
    return <GameCompleteOverlay />;
  }

  return null;
}
