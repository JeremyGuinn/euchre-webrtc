import type { Card, Player } from '~/types/game';
import { FirstBlackJackSelection } from './FirstBlackJackSelection';
import { RandomCardsSelection } from './RandomCardsSelection';

interface DealerSelectionAnimationProps {
  players: Player[];
  myPlayer: Player;
  isVisible: boolean;
  deck: Card[];
  method: 'first_black_jack' | 'random_cards';
  dealerSelectionCards?: Record<string, Card>;
  onCardPicked?: (cardIndex: number) => void;
  onComplete: () => void;
}

export function DealerSelectionAnimation({
  players,
  myPlayer,
  isVisible,
  deck,
  method,
  dealerSelectionCards,
  onCardPicked,
  onComplete,
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
          onComplete={onComplete}
        />
      );
    case 'first_black_jack':
      return (
        <FirstBlackJackSelection
          players={players}
          myPlayer={myPlayer}
          isVisible={isVisible}
          deck={deck}
          onComplete={onComplete}
        />
      );
    default:
      return null;
  }
}
