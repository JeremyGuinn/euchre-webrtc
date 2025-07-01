import type { Card } from '../types/game';

export function createDeck(): Card[] {
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const values: Card['value'][] = ['9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value,
        id: `${suit}-${value}`
      });
    }
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealHands(deck: Card[]): {
  hands: [Card[], Card[], Card[], Card[]];
  kitty: Card;
  remainingDeck: Card[];
} {
  const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []];
  let cardIndex = 0;

  // Deal 5 cards to each player (standard Euchre dealing pattern)
  // First round: 3 cards to each player
  for (let round = 0; round < 2; round++) {
    const cardsThisRound = round === 0 ? 3 : 2;
    for (let player = 0; player < 4; player++) {
      for (let card = 0; card < cardsThisRound; card++) {
        hands[player].push(deck[cardIndex]);
        cardIndex++;
      }
    }
  }

  const kitty = deck[cardIndex];
  cardIndex++;

  return {
    hands,
    kitty,
    remainingDeck: deck.slice(cardIndex)
  };
}

export function getCardValue(card: Card, trump: Card['suit']): number {
  const { suit, value } = card;
  
  // Handle Jacks (trump jack is highest, off-jack is second highest)
  if (value === 'J') {
    if (suit === trump) return 11; // Trump jack (highest)
    if (getOffSuit(trump) === suit) return 10; // Off-jack (second highest)
  }
  
  // Handle trump cards
  if (suit === trump) {
    switch (value) {
      case 'A': return 9;
      case 'K': return 8;
      case 'Q': return 7;
      case '10': return 6;
      case '9': return 5;
      default: return 0;
    }
  }
  
  // Handle non-trump cards
  switch (value) {
    case 'A': return 4;
    case 'K': return 3;
    case 'Q': return 2;
    case 'J': return 1; // Non-trump, non-off jack
    case '10': return 1;
    case '9': return 0;
    default: return 0;
  }
}

export function getOffSuit(trump: Card['suit']): Card['suit'] {
  switch (trump) {
    case 'spades': return 'clubs';
    case 'clubs': return 'spades';
    case 'hearts': return 'diamonds';
    case 'diamonds': return 'hearts';
    default: return trump;
  }
}

export function getEffectiveSuit(card: Card, trump: Card['suit']): Card['suit'] {
  // Off-jack becomes trump suit
  if (card.value === 'J' && card.suit === getOffSuit(trump)) {
    return trump;
  }
  return card.suit;
}

export function canPlayCard(card: Card, hand: Card[], leadSuit?: Card['suit'], trump?: Card['suit']): boolean {
  if (!leadSuit) return true; // First card of trick, any card is valid
  if (!trump) return true; // No trump set yet
  
  const cardEffectiveSuit = getEffectiveSuit(card, trump);
  
  // Must follow suit if possible
  const hasLeadSuit = hand.some(c => getEffectiveSuit(c, trump) === leadSuit);
  
  if (hasLeadSuit) {
    return cardEffectiveSuit === leadSuit;
  }
  
  // If can't follow suit, any card is valid
  return true;
}

export function getWinningCard(cards: Array<{ card: Card; playerId: string }>, trump: Card['suit'], leadSuit: Card['suit']): { card: Card; playerId: string } {
  if (cards.length === 0) throw new Error('No cards to evaluate');
  
  let winningPlay = cards[0];
  let highestValue = getCardValue(winningPlay.card, trump);
  let isWinningTrump = getEffectiveSuit(winningPlay.card, trump) === trump;
  let isWinningLeadSuit = getEffectiveSuit(winningPlay.card, trump) === leadSuit;
  
  for (let i = 1; i < cards.length; i++) {
    const currentPlay = cards[i];
    const currentCard = currentPlay.card;
    const currentValue = getCardValue(currentCard, trump);
    const currentIseTrump = getEffectiveSuit(currentCard, trump) === trump;
    const currentIsLeadSuit = getEffectiveSuit(currentCard, trump) === leadSuit;
    
    // Trump always beats non-trump
    if (currentIseTrump && !isWinningTrump) {
      winningPlay = currentPlay;
      highestValue = currentValue;
      isWinningTrump = true;
      isWinningLeadSuit = currentIsLeadSuit;
    }
    // If both trump or both non-trump, higher value wins
    else if (currentIseTrump === isWinningTrump) {
      if (currentValue > highestValue) {
        winningPlay = currentPlay;
        highestValue = currentValue;
        isWinningLeadSuit = currentIsLeadSuit;
      }
    }
    // Non-trump can only win if current winner is also non-trump and it's lead suit
    else if (!currentIseTrump && !isWinningTrump && currentIsLeadSuit && !isWinningLeadSuit) {
      winningPlay = currentPlay;
      highestValue = currentValue;
      isWinningLeadSuit = true;
    }
  }
  
  return winningPlay;
}
