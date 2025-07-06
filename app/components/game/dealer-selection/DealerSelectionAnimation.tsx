import type { Card, Player } from '~/types/game';
import { FirstBlackJackSelection } from './FirstBlackJackSelection';
import { RandomCardsSelection } from './RandomCardsSelection';

interface DealerSelectionAnimationProps {
  players: Player[];
  myPlayer: Player;
  isVisible: boolean;
  deck: Card[];
  method: 'first_black_jack' | 'random_cards' | 'predetermined_first_dealer';
  dealerSelectionCards?: Record<string, Card>;
  onCardPicked?: (cardIndex: number) => void;
}

export function DealerSelectionAnimation({
  players,
  myPlayer,
  isVisible,
  deck,
  method,
  dealerSelectionCards,
  onCardPicked,
}: DealerSelectionAnimationProps) {
  switch (method) {
    case 'random_cards':
      return (
        <RandomCardsSelection
          players={players}
          myPlayer={myPlayer}
          isVisible={isVisible}
          dealerSelectionCards={dealerSelectionCards}
          onCardPicked={onCardPicked}
        />
      );
    case 'first_black_jack':
      return (
        <FirstBlackJackSelection
          players={players}
          myPlayer={myPlayer}
          isVisible={isVisible}
          deck={deck}
        />
      );
    case 'predetermined_first_dealer':
      // For predetermined dealer, we don't need an animation
      // The dealer is already selected and game should proceed
      return null;
    default:
      return null;
  }
}
