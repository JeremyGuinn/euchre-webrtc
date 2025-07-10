import type { Card } from '~/types/game';

/**
 * Card suit symbols for display
 */
export const SUIT_SYMBOLS = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
} as const;

/**
 * Card suit colors for styling (Tailwind classes)
 */
export const SUIT_COLORS = {
  spades: 'text-black',
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black',
} as const;

/**
 * Get the symbol for a card suit
 */
export function getSuitSymbol(suit: Card['suit']): string {
  return SUIT_SYMBOLS[suit];
}

/**
 * Get the Tailwind color class for a card suit
 */
export function getSuitColor(suit: Card['suit']): string {
  return SUIT_COLORS[suit];
}

/**
 * Format a card for display with symbol and value
 */
export function formatCard(card: Card): string {
  return `${getSuitSymbol(card.suit)} ${card.value}`;
}

/**
 * Get formatted card display with styling
 */
export function getCardDisplay(card: Card): { symbol: string; value: string; colorClass: string } {
  return {
    symbol: getSuitSymbol(card.suit),
    value: card.value,
    colorClass: getSuitColor(card.suit),
  };
}
