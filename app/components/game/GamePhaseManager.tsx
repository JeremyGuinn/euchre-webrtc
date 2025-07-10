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
import { useGameUI } from '~/hooks/useGameUI';
import { useGameStore } from '~/store/gameStore';

interface GamePhaseManagerProps {
  headerHeight: number;
}

export function GamePhaseManager({ headerHeight }: GamePhaseManagerProps) {
  const gameState = useGameStore();
  const { isHost, myPlayer } = useGameUI();
  const { selectDealer, isMyTurn } = useGame();

  // Dealer Selection Animation
  if (gameState.phase === 'dealer_selection') {
    if (!gameState.dealerSelectionCards && !gameState.firstBlackJackDealing) {
      // Initial state - show instruction overlay
      return (
        <Center className='absolute inset-0 bg-black/60 z-40'>
          <div className='text-white text-center p-8 bg-black/40 rounded-lg backdrop-blur-sm border border-white/20'>
            <h2 className='text-3xl font-bold mb-4'>
              {gameState.options.dealerSelection === 'random_cards' &&
              gameState.options.teamSelection === 'random_cards'
                ? 'Dealer and Team Selection'
                : 'Dealer Selection'}
            </h2>
            <p className='text-lg mb-4'>
              {gameState.options.dealerSelection === 'random_cards' &&
                gameState.options.teamSelection === 'predetermined' &&
                'Each player will draw a card to determine the dealer.'}
              {gameState.options.dealerSelection === 'random_cards' &&
                gameState.options.teamSelection === 'random_cards' &&
                'Each player will draw a card to determine the dealer and teams.'}
              {gameState.options.dealerSelection === 'first_black_jack' &&
                gameState.options.teamSelection === 'predetermined' &&
                'The player with the first Black Jack will be the dealer.'}
              {gameState.options.dealerSelection === 'first_black_jack' &&
                gameState.options.teamSelection === 'random_cards' &&
                'The player with the first Black Jack will be the dealer, and the two players with the lowest cards will form one team.'}
              {gameState.options.dealerSelection === 'predetermined_first_dealer' &&
                'The predetermined dealer has been selected and the game will continue.'}
            </p>
            {gameState.options.teamSelection === 'random_cards' &&
              gameState.options.dealerSelection === 'random_cards' && (
                <p className='text-sm text-gray-300 mb-6'>
                  The two players with the lowest cards will form one team.
                  <br />
                  The player with the lowest card will be the dealer.
                </p>
              )}

            {isHost ? (
              <Button onClick={() => selectDealer()} size='lg'>
                {gameState.options.dealerSelection === 'random_cards'
                  ? 'Start Card Drawing'
                  : gameState.options.dealerSelection === 'first_black_jack'
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
  if (gameState.phase === 'team_summary') {
    return <TeamSummaryOverlay />;
  }

  // Dealing Animation
  if (gameState.phase === 'dealing_animation') {
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
  if (
    ((gameState.phase === 'bidding_round1' && gameState.kitty) ||
      gameState.phase === 'bidding_round2') &&
    isMyTurn()
  ) {
    return <BiddingInterface />;
  }

  // Trick Complete - Show winner and continue
  if (gameState.phase === 'trick_complete') {
    return <TrickCompleteOverlay />;
  }

  // Hand Complete - Show hand results
  if (gameState.phase === 'hand_complete') {
    return <HandCompleteOverlay />;
  }

  // Farmer's Hand Interface - Allow player to swap cards
  if (gameState.phase === 'farmers_hand_swap') {
    if (gameState.farmersHandPosition === myPlayer?.position) {
      return <FarmersHandInterface />;
    } else if (gameState.farmersHandPosition) {
      return <FarmersHandWaiting />;
    }
  }

  // Game Complete - Show final results
  if (gameState.phase === 'game_complete') {
    return <GameCompleteOverlay />;
  }

  return null;
}
