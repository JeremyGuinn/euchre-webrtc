export type Position = 'bottom' | 'left' | 'top' | 'right';
export type PositionIndex = 0 | 1 | 2 | 3;
export type TeamIndex = 0 | 1;

export type Card = {
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  value: '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  id: string;
};

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  position: PositionIndex; // Position around the table
  teamId: TeamIndex; // Team 0: positions 0,2; Team 1: positions 1,3
};

export type GamePhase =
  | 'lobby'
  | 'dealer_selection'
  | 'team_summary' // Show dealer and team assignments before dealing
  | 'dealing_animation' // Showing the dealing animation
  | 'dealing' // Cards being dealt (internal state)
  | 'farmers_hand_check' // Check if any player has a farmer's hand (all 9s and 10s)
  | 'farmers_hand_swap' // Player is swapping cards with the kitty
  | 'bidding_round1' // First round: can order up/assist the turned up card
  | 'bidding_round2' // Second round: can call any suit except the turned up suit
  | 'dealer_discard' // Dealer must discard a card after taking up the kitty
  | 'playing'
  | 'trick_complete'
  | 'hand_complete'
  | 'game_complete';

export type Bid = {
  playerPosition: PositionIndex;
  suit: Card['suit'] | 'pass';
  alone?: boolean;
};

export type Trick = {
  id: string;
  cards: Array<{
    card: Card;
    playerPosition: PositionIndex;
  }>;
  winnerPosition?: PositionIndex;
  leaderPosition: PositionIndex;
};

export type GameOptions = {
  teamSelection: 'predetermined' | 'random_cards';
  dealerSelection: 'random_cards' | 'first_black_jack' | 'predetermined_first_dealer';
  predeterminedFirstDealerId?: string;
  allowReneging: boolean;
  screwTheDealer: boolean;
  farmersHand: boolean;
};

export type GameState = {
  id: string;
  gameCode?: string; // User-friendly game code
  myPlayerId?: string; // ID of the current player
  players: Player[];
  phase: GamePhase;
  options: GameOptions;
  currentDealerPosition: PositionIndex;
  currentPlayerPosition?: PositionIndex;
  deck: Card[];
  hands: Record<PositionIndex, Card[]>; // Keyed by position instead of player ID
  trump?: Card['suit'];
  kitty?: Card; // The turned-up card
  turnedDownSuit?: Card['suit']; // The suit that was turned down in round 1
  bids: Bid[];
  currentTrick?: Trick;
  completedTricks: Trick[];
  scores: {
    team0: number;
    team1: number;
  };
  handScores: {
    team0: number;
    team1: number;
  };
  teamNames: {
    team0: string;
    team1: string;
  };
  maker?: {
    playerPosition: PositionIndex;
    teamId: TeamIndex;
    alone: boolean;
  };
  farmersHandPosition?: PositionIndex; // Position of player who has a farmer's hand
  dealerSelectionCards?: Partial<Record<PositionIndex, Card>>; // Cards drawn for dealer selection
  firstBlackJackDealing?: {
    currentPlayerIndex: number;
    currentCardIndex: number;
    dealtCards: Array<{ playerPosition: PositionIndex; card: Card }>;
    blackJackFound?: { playerPosition: PositionIndex; card: Card };
  };
};

export type PublicGameState = Omit<GameState, 'hands'> & {
  playerHand?: Card[]; // Only for the current player
  deck: Card[]; // Placeholder cards for clients, actual cards for host
};
