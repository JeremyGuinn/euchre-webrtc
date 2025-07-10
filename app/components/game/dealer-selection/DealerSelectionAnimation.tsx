import { useGameUI } from '~/hooks/useGameUI';
import { useGameStore } from '~/store/gameStore';
import { FirstBlackJackSelection } from './FirstBlackJackSelection';
import { RandomCardsSelection } from './RandomCardsSelection';

export function DealerSelectionAnimation() {
  const {
    players,
    deck,
    options: { dealerSelection },
    dealerSelectionCards,
  } = useGameStore();
  const { myPlayer } = useGameUI();

  if (!myPlayer) return null;

  switch (dealerSelection) {
    case 'random_cards':
      return <RandomCardsSelection />;
    case 'first_black_jack':
      return <FirstBlackJackSelection />;
    case 'predetermined_first_dealer':
      // For predetermined dealer, we don't need an animation
      // The dealer is already selected and game should proceed
      return null;
    default:
      return null;
  }
}
