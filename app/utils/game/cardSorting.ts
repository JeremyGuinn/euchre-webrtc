import type { Card } from '~/types/game';

// Define the order of suits for sorting
const SUIT_ORDER = ['clubs', 'diamonds', 'hearts', 'spades'] as const;

// Define the order of card values for sorting (lowest to highest)
const VALUE_ORDER = ['9', '10', 'J', 'Q', 'K', 'A'] as const;

/**
 * Gets the numeric value for a card suit for sorting purposes
 */
function getSuitSortValue(suit: Card['suit']): number {
  return SUIT_ORDER.indexOf(suit);
}

/**
 * Gets the numeric value for a card value for sorting purposes
 */
function getValueSortValue(value: Card['value']): number {
  return VALUE_ORDER.indexOf(value);
}

/**
 * Determines if a Jack is the right bower (Jack of trump suit) or left bower (Jack of same color as trump)
 */
function getJackSortValue(card: Card, trump?: Card['suit']): number {
  if (card.value !== 'J' || !trump) {
    return getValueSortValue(card.value);
  }

  // Right bower (Jack of trump suit) - highest value
  if (card.suit === trump) {
    return 100;
  }

  // Left bower (Jack of same color as trump) - second highest
  const trumpColor = trump === 'hearts' || trump === 'diamonds' ? 'red' : 'black';
  const cardColor = card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black';

  if (trumpColor === cardColor) {
    return 99;
  }

  // Regular Jack
  return getValueSortValue(card.value);
}

/**
 * Gets the effective suit of a card considering trump
 * Left bower is considered trump suit
 */
function getEffectiveSuitForSorting(card: Card, trump?: Card['suit']): Card['suit'] {
  if (card.value === 'J' && trump) {
    const trumpColor = trump === 'hearts' || trump === 'diamonds' ? 'red' : 'black';
    const cardColor = card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black';

    // Left bower is considered trump suit for sorting
    if (trumpColor === cardColor && card.suit !== trump) {
      return trump;
    }
  }

  return card.suit;
}

/**
 * Sorts cards by suit and then by rank, with trump cards grouped together
 * and special handling for right and left bowers
 */
export function sortCards(cards: Card[], trump?: Card['suit']): Card[] {
  return [...cards].sort((a, b) => {
    const aEffectiveSuit = getEffectiveSuitForSorting(a, trump);
    const bEffectiveSuit = getEffectiveSuitForSorting(b, trump);

    // First sort by effective suit (trump cards come first if trump is set)
    if (trump) {
      const aIsTrump = aEffectiveSuit === trump;
      const bIsTrump = bEffectiveSuit === trump;

      if (aIsTrump && !bIsTrump) return -1;
      if (!aIsTrump && bIsTrump) return 1;
    }

    // If same effective suit, sort by value (considering bower rules)
    if (aEffectiveSuit === bEffectiveSuit) {
      const aValue = getJackSortValue(a, trump);
      const bValue = getJackSortValue(b, trump);
      return bValue - aValue; // Descending order (highest cards first)
    }

    // Different suits, sort by suit order
    return getSuitSortValue(aEffectiveSuit) - getSuitSortValue(bEffectiveSuit);
  });
}

/**
 * Sorts cards by suit only, ignoring trump rules (simpler sorting)
 */
export function sortCardsBySuit(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // First sort by suit
    const suitComparison = getSuitSortValue(a.suit) - getSuitSortValue(b.suit);
    if (suitComparison !== 0) {
      return suitComparison;
    }

    // If same suit, sort by value (descending)
    const aValue = getValueSortValue(a.value);
    const bValue = getValueSortValue(b.value);
    return bValue - aValue;
  });
}
