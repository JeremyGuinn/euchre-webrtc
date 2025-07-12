import { useState } from 'react';
import { Card } from '~/components/game/Card';
import Button from '~/components/ui/Button';
import Panel from '~/components/ui/Panel';
import { useGame } from '~/contexts/GameContext';
import { gameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import type { Card as CardType } from '~/types/game';

export function FarmersHandInterface() {
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const { swapFarmersHand, declineFarmersHand } = useGame();

  const hand = gameStore(select.myHand);

  const handleCardClick = (card: CardType) => {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        // Deselect card
        return prev.filter(c => c.id !== card.id);
      } else if (prev.length < 3) {
        // Select card (max 3)
        return [...prev, card];
      }
      return prev; // Already have 3 selected
    });
  };

  const handleSwap = () => {
    if (selectedCards.length === 3) {
      swapFarmersHand(selectedCards);
    }
  };

  const isCardSelected = (card: CardType) => {
    return selectedCards.some(c => c.id === card.id);
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <Panel variant='default' shadow='xl' className='max-w-4xl w-full mx-4'>
        <div className='text-center mb-6'>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>Farmer&apos;s Hand Detected!</h2>
          <p className='text-gray-600'>
            You have all 9s and 10s. You may swap any 3 cards with 3 face-down cards from the deck.
          </p>
        </div>

        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-700 mb-3'>
            Your Hand (Select 3 cards to swap)
          </h3>
          <div className='flex justify-center space-x-2 flex-wrap gap-2'>
            {hand.map(card => (
              <button
                key={card.id}
                type='button'
                className={`cursor-pointer transition-all ${
                  isCardSelected(card)
                    ? 'ring-4 ring-blue-500 ring-offset-2 transform -translate-y-2'
                    : 'hover:transform hover:-translate-y-1'
                }`}
                onClick={() => handleCardClick(card)}
              >
                <Card card={card} size='medium' />
              </button>
            ))}
          </div>
          <p className='text-sm text-gray-500 mt-2 text-center'>
            Selected: {selectedCards.length}/3 cards
          </p>
        </div>

        <div className='flex justify-center space-x-4'>
          <Button variant='secondary' onClick={() => declineFarmersHand()} className='px-6 py-2'>
            Keep Current Hand
          </Button>

          <Button
            variant='primary'
            onClick={handleSwap}
            disabled={selectedCards.length !== 3}
            className='px-6 py-2'
          >
            Swap Cards
          </Button>
        </div>

        <div className='mt-4 text-xs text-gray-500 text-center'>
          <p>
            If you swap, your 3 selected cards will be replaced with 3 face-down cards from the
            deck.
          </p>
        </div>
      </Panel>
    </div>
  );
}
