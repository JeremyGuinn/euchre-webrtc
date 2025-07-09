import type { Card, Player } from '~/types/game';

export function createDeck(): Card[] {
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const values: Card['value'][] = ['9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value,
        id: `${suit}-${value}`,
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

  return {
    hands,
    kitty: deck[cardIndex],
    remainingDeck: deck.slice(cardIndex + 1),
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
      case 'A':
        return 9;
      case 'K':
        return 8;
      case 'Q':
        return 7;
      case '10':
        return 6;
      case '9':
        return 5;
      default:
        return 0;
    }
  }

  // Handle non-trump cards
  switch (value) {
    case 'A':
      return 4;
    case 'K':
      return 3;
    case 'Q':
      return 2;
    case 'J':
      return 1; // Non-trump, non-off jack
    case '10':
      return 1;
    case '9':
      return 0;
    default:
      return 0;
  }
}

export function getOffSuit(trump: Card['suit']): Card['suit'] {
  switch (trump) {
    case 'spades':
      return 'clubs';
    case 'clubs':
      return 'spades';
    case 'hearts':
      return 'diamonds';
    case 'diamonds':
      return 'hearts';
    default:
      return trump;
  }
}

export function getEffectiveSuit(card: Card, trump: Card['suit']): Card['suit'] {
  // Off-jack becomes trump suit
  if (card.value === 'J' && card.suit === getOffSuit(trump)) {
    return trump;
  }
  return card.suit;
}

export function canPlayCard(
  card: Card,
  hand: Card[],
  leadSuit?: Card['suit'],
  trump?: Card['suit']
): boolean {
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

export function getWinningCard(
  cards: Array<{ card: Card; playerId: string }>,
  trump: Card['suit'],
  leadSuit: Card['suit']
): { card: Card; playerId: string } {
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
    // If both trump
    else if (currentIseTrump && isWinningTrump) {
      if (currentValue > highestValue) {
        winningPlay = currentPlay;
        highestValue = currentValue;
        isWinningLeadSuit = currentIsLeadSuit;
      }
    }
    // Non-trump can only win if current winner is also non-trump and it's lead suit
    else if (!currentIseTrump && !isWinningTrump && currentIsLeadSuit && isWinningLeadSuit) {
      if (currentValue > highestValue) {
        winningPlay = currentPlay;
        highestValue = currentValue;
        isWinningLeadSuit = true;
      }
    }
  }

  return winningPlay;
}

/**
 * Get the rank value for dealer selection
 * Aces rank low (1), Jacks rank below Queens (11), suits are irrelevant
 */
export function getDealerSelectionRank(card: Card): number {
  switch (card.value) {
    case 'A':
      return 1; // Aces rank low
    case '9':
      return 9;
    case '10':
      return 10;
    case 'J':
      return 11; // Jacks rank below Queens
    case 'Q':
      return 12;
    case 'K':
      return 13;
    default:
      return 0;
  }
}

/**
 * Select dealer and arrange teams based on drawn cards
 * Returns the player assignments with correct positions and teams
 */
export function selectDealerAndTeams(
  players: Player[],
  drawnCards: Record<string, Card>
): {
  dealer: Player;
  arrangedPlayers: Player[];
} {
  // Sort players by their drawn card rank (lowest first)
  const playersWithCards = players
    .map(player => ({
      player,
      card: drawnCards[player.id],
      rank: getDealerSelectionRank(drawnCards[player.id]),
    }))
    .sort((a, b) => {
      // If ranks are equal, maintain current order (arbitrary but consistent)
      if (a.rank === b.rank) {
        // Use card id as tiebreaker for consistency
        return a.card.id.localeCompare(b.card.id);
      }
      return a.rank - b.rank;
    });

  // The player with the lowest card deals first
  const dealer = playersWithCards[0].player;

  // The players with the two lowest cards play together
  const team0Players = [playersWithCards[0].player, playersWithCards[1].player];
  const team1Players = [playersWithCards[2].player, playersWithCards[3].player];

  // Arrange players in positions: dealer at position 0, then clockwise
  const arrangedPlayers: Player[] = [];

  // Dealer gets position 0
  arrangedPlayers[0] = {
    ...dealer,
    position: 0,
    teamId: team0Players.includes(dealer) ? 0 : 1,
  };

  // Find dealer's partner (same team)
  const dealerTeam = team0Players.includes(dealer) ? team0Players : team1Players;
  const dealerPartner = dealerTeam.find(p => p.id !== dealer.id)!;

  // Partner sits opposite (position 2)
  arrangedPlayers[2] = {
    ...dealerPartner,
    position: 2,
    teamId: arrangedPlayers[0].teamId,
  };

  // Remaining two players are opponents
  const opponents = playersWithCards
    .map(pc => pc.player)
    .filter(p => p.id !== dealer.id && p.id !== dealerPartner.id);

  // Arrange opponents in positions 1 and 3
  arrangedPlayers[1] = {
    ...opponents[0],
    position: 1,
    teamId: arrangedPlayers[0].teamId === 0 ? 1 : 0,
  };

  arrangedPlayers[3] = {
    ...opponents[1],
    position: 3,
    teamId: arrangedPlayers[1].teamId,
  };

  return {
    dealer: arrangedPlayers[0],
    arrangedPlayers,
  };
}

/**
 * Select dealer from random cards but keep predetermined teams
 */
export function selectDealerOnly(
  players: Player[],
  drawnCards: Record<string, Card>
): {
  dealer: Player;
  arrangedPlayers: Player[];
} {
  // Sort players by their drawn card rank (lowest first) to find dealer
  const playersWithCards = players
    .map(player => ({
      player,
      card: drawnCards[player.id],
      rank: getDealerSelectionRank(drawnCards[player.id]),
    }))
    .sort((a, b) => {
      if (a.rank === b.rank) {
        return a.card.id.localeCompare(b.card.id);
      }
      return a.rank - b.rank;
    });

  // The player with the lowest card deals first
  const dealer = playersWithCards[0].player;

  // Keep players in their current positions but update dealer position to 0
  const arrangedPlayers: Player[] = [];
  const dealerOriginalPosition = dealer.position;

  // Rotate positions so dealer is at position 0
  players.forEach(player => {
    const newPosition = ((player.position - dealerOriginalPosition + 4) % 4) as 0 | 1 | 2 | 3;
    arrangedPlayers[newPosition] = {
      ...player,
      position: newPosition,
      // Keep original team assignments based on new positions
      teamId: (newPosition % 2) as 0 | 1,
    };
  });

  return {
    dealer: arrangedPlayers[0],
    arrangedPlayers,
  };
}

/**
 * Find the first player to receive a black Jack when dealing around the table
 */

export function findFirstBlackJackDealer(
  deck: Card[],
  players: Player[]
): {
  dealer: Player;
  arrangedPlayers: Player[];
} {
  let currentPlayerIndex = 0;
  let cardIndex = 0;

  // Deal cards around until someone gets a black Jack
  while (cardIndex < deck.length) {
    const card = deck[cardIndex];
    const currentPlayer = players[currentPlayerIndex];

    // Check if this is a black Jack (Jack of Spades or Jack of Clubs)
    if (card.value === 'J' && (card.suit === 'spades' || card.suit === 'clubs')) {
      // This player becomes the dealer
      const dealer = currentPlayer;
      const dealerOriginalPosition = dealer.position;

      // Arrange players so dealer is at position 0
      const arrangedPlayers: Player[] = [];
      players.forEach(player => {
        const newPosition = ((player.position - dealerOriginalPosition + 4) % 4) as 0 | 1 | 2 | 3;
        arrangedPlayers[newPosition] = {
          ...player,
          position: newPosition,
          teamId: (newPosition % 2) as 0 | 1,
        };
      });

      return {
        dealer: arrangedPlayers[0],
        arrangedPlayers,
      };
    }

    // Move to next player
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    cardIndex++;
  }

  // Fallback: if no black Jack found, first player deals
  const arrangedPlayers = players.map((player, index) => ({
    ...player,
    position: index as 0 | 1 | 2 | 3,
    teamId: (index % 2) as 0 | 1,
  }));

  return {
    dealer: arrangedPlayers[0],
    arrangedPlayers,
  };
}

/**
 * Update canPlayCard to respect the allowReneging option
 */
export function canPlayCardWithOptions(
  card: Card,
  hand: Card[],
  leadSuit?: Card['suit'],
  trump?: Card['suit'],
  allowReneging: boolean = false
): boolean {
  // If reneging is allowed, any card can be played
  if (allowReneging) {
    return true;
  }

  // Otherwise, use standard euchre rules
  return canPlayCard(card, hand, leadSuit, trump);
}

/**
 * Check if a hand qualifies as a farmer's hand (all cards are 9s or 10s)
 */
export function isFarmersHand(hand: Card[]): boolean {
  return hand.every(card => card.value === '9' || card.value === '10');
}

/**
 * Perform farmer's hand swap - replace selected cards with the bottom 3 cards from the deck
 */
export function performFarmersHandSwap(
  hand: Card[],
  cardsToSwap: Card[],
  kitty: Card,
  remainingDeck: Card[]
): {
  newHand: Card[];
  newKitty: Card;
  newRemainingDeck: Card[];
} {
  if (cardsToSwap.length !== 3) {
    throw new Error("Farmer's hand swap must involve exactly 3 cards");
  }

  // Remove the cards to swap from the hand
  const newHand = hand.filter(card => !cardsToSwap.some(swapCard => swapCard.id === card.id));

  // Add the bottom 3 cards from the deck to the hand
  const bottom3Cards = remainingDeck.slice(-3);
  newHand.push(...bottom3Cards);

  // Kitty remains unchanged
  const newKitty = kitty;

  // Add the swapped cards to the deck and remove the bottom 3 cards
  const newRemainingDeck = [...cardsToSwap, ...remainingDeck.slice(0, -3)];

  return {
    newHand,
    newKitty,
    newRemainingDeck,
  };
}

/**
 * Testing function that deals one player all 9s and 10s (farmer's hand)
 * Used for testing farmer's hand functionality
 */
export function dealTestFarmersHand(
  deck: Card[],
  farmerPlayerIndex: number = 0
): {
  hands: [Card[], Card[], Card[], Card[]];
  kitty: Card;
  remainingDeck: Card[];
} {
  const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []];

  // Find all 9s and 10s in the deck
  const farmersCards = deck.filter(card => card.value === '9' || card.value === '10');
  const otherCards = deck.filter(card => card.value !== '9' && card.value !== '10');

  // Give the farmer player all 9s and 10s (take first 5)
  hands[farmerPlayerIndex] = farmersCards.slice(0, 5);

  // Deal remaining cards to other players
  let cardIndex = 0;
  const remainingFarmersCards = farmersCards.slice(5);
  const allRemainingCards = [...remainingFarmersCards, ...otherCards];

  for (let player = 0; player < 4; player++) {
    if (player === farmerPlayerIndex) continue; // Skip farmer player

    for (let card = 0; card < 5; card++) {
      if (cardIndex < allRemainingCards.length) {
        hands[player].push(allRemainingCards[cardIndex]);
        cardIndex++;
      }
    }
  }

  // Set kitty from remaining cards
  const kitty = allRemainingCards[cardIndex] || otherCards[0];
  cardIndex++;

  return {
    hands,
    kitty,
    remainingDeck: allRemainingCards.slice(cardIndex),
  };
}
