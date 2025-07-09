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
import { useGameStore } from '~/store/gameStore';
import type { Card as CardType, GameState, Player } from '~/types/game';

interface GamePhaseManagerProps {
  gameState: GameState;
  myPlayer: Player;
  myHand: CardType[];
  isHost: boolean;
  isMyTurn: () => boolean;
  headerHeight: number;
  autoAdvanceProgress: number;
  gameCode: string;
  suitSymbols: Record<string, string>;
  suitColors: Record<string, string>;
  onBid: (suit: CardType['suit'] | 'pass', alone?: boolean) => void;
  onSelectDealer: () => void;
  onDrawDealerCard: (cardIndex: number) => void;
  onProceedToDealing: () => void;
  onCompleteDealingAnimation: () => void;
  onContinueTrick: () => void;
  onCompleteHand: () => void;
  onSwapFarmersHand: (cards: CardType[]) => void;
  onDeclineFarmersHand: () => void;
  onRenameTeam: (teamId: 0 | 1, newName: string) => void;
  onLeaveGame: () => void;
}

export function GamePhaseManager({
  gameState,
  myPlayer,
  myHand,
  isHost,
  isMyTurn,
  headerHeight,
  autoAdvanceProgress,
  gameCode,
  suitSymbols,
  suitColors,
  onBid,
  onSelectDealer,
  onDrawDealerCard,
  onProceedToDealing,
  onCompleteDealingAnimation,
  onContinueTrick,
  onCompleteHand,
  onSwapFarmersHand,
  onDeclineFarmersHand,
  onRenameTeam,
  onLeaveGame,
}: GamePhaseManagerProps) {
  const gameStore = useGameStore();
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
              <Button onClick={onSelectDealer} size='lg'>
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
          <DealerSelectionAnimation
            players={gameState.players}
            myPlayer={myPlayer}
            isVisible={true}
            deck={gameState.deck}
            method={gameState.options.dealerSelection}
            dealerSelectionCards={gameState.dealerSelectionCards}
            onCardPicked={onDrawDealerCard}
          />
        </div>
      );
    }
  }

  // Team Summary - Show dealer and team assignments
  if (gameState.phase === 'team_summary') {
    return (
      <TeamSummaryOverlay
        gameState={gameState}
        suitSymbols={suitSymbols}
        suitColors={suitColors}
        myPlayer={myPlayer}
        isHost={isHost}
        onRenameTeam={onRenameTeam}
        onProceedToDealing={onProceedToDealing}
      />
    );
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
        <DealingAnimation
          players={gameState.players}
          myPlayer={myPlayer}
          isVisible={true}
          currentDealerId={gameState.currentDealerId}
          onComplete={onCompleteDealingAnimation}
        />
      </div>
    );
  }

  // Bidding Interface - positioned below player's hand
  if (
    ((gameState.phase === 'bidding_round1' && gameState.kitty) ||
      gameState.phase === 'bidding_round2') &&
    isMyTurn()
  ) {
    return (
      <BiddingInterface
        phase={gameState.phase as 'bidding_round1' | 'bidding_round2'}
        kitty={gameState.kitty}
        isDealer={gameState.currentDealerId === myPlayer.id}
        isDealerTeammate={(() => {
          const dealer = gameState.players.find(p => p.id === gameState.currentDealerId);
          return dealer ? dealer.teamId === myPlayer.teamId && dealer.id !== myPlayer.id : false;
        })()}
        turnedDownSuit={gameState.turnedDownSuit}
        suitSymbols={suitSymbols}
        suitColors={suitColors}
        _screwTheDealer={gameState.options.screwTheDealer}
        isDealerScrewed={gameStore.isDealerScrewed()}
        onBid={onBid}
      />
    );
  }

  // Trick Complete - Show winner and continue
  if (gameState.phase === 'trick_complete') {
    return (
      <TrickCompleteOverlay
        gameState={gameState}
        myPlayer={myPlayer}
        isHost={isHost}
        autoAdvanceProgress={autoAdvanceProgress}
        suitSymbols={suitSymbols}
        suitColors={suitColors}
        onContinueTrick={onContinueTrick}
      />
    );
  }

  // Hand Complete - Show hand results
  if (gameState.phase === 'hand_complete') {
    return (
      <HandCompleteOverlay
        gameState={gameState}
        myPlayer={myPlayer}
        isHost={isHost}
        suitSymbols={suitSymbols}
        suitColors={suitColors}
        onCompleteHand={onCompleteHand}
      />
    );
  }

  // Farmer's Hand Interface - Allow player to swap cards
  if (gameState.phase === 'farmers_hand_swap') {
    if (gameState.farmersHandPlayer === myPlayer.id) {
      return (
        <FarmersHandInterface
          hand={myHand}
          onSwap={onSwapFarmersHand}
          onDecline={onDeclineFarmersHand}
        />
      );
    } else if (gameState.farmersHandPlayer) {
      return (
        <FarmersHandWaiting
          farmersHandPlayer={gameState.players.find(p => p.id === gameState.farmersHandPlayer)!}
        />
      );
    }
  }

  // Game Complete - Show final results
  if (gameState.phase === 'game_complete') {
    return (
      <GameCompleteOverlay
        gameState={gameState}
        myPlayer={myPlayer}
        isHost={isHost}
        gameCode={gameCode}
        onLeaveGame={onLeaveGame}
      />
    );
  }

  return null;
}
