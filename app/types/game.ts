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
  position: 0 | 1 | 2 | 3; // Position around the table
  teamId: 0 | 1; // Team 0: positions 0,2; Team 1: positions 1,3
};

export type GamePhase =
  | 'lobby'
  | 'dealer_selection'
  | 'team_summary' // Show dealer and team assignments before dealing
  | 'dealing_animation' // Showing the dealing animation
  | 'dealing' // Cards being dealt (internal state)
  | 'bidding_round1' // First round: can order up/assist the turned up card
  | 'bidding_round2' // Second round: can call any suit except the turned up suit
  | 'dealer_discard' // Dealer must discard a card after taking up the kitty
  | 'playing'
  | 'trick_complete'
  | 'hand_complete'
  | 'game_complete';

export type Bid = {
  playerId: string;
  suit: Card['suit'] | 'pass';
  alone?: boolean;
};

export type Trick = {
  id: string;
  cards: Array<{
    card: Card;
    playerId: string;
  }>;
  winnerId?: string;
  leaderId: string;
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
  players: Player[];
  phase: GamePhase;
  options: GameOptions;
  currentDealerId: string;
  currentPlayerId?: string;
  deck: Card[];
  hands: Record<string, Card[]>; // Only on host
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
    playerId: string;
    teamId: 0 | 1;
    alone: boolean;
  };
  dealerSelectionCards?: Record<string, Card>; // Cards drawn for dealer selection
  firstBlackJackDealing?: {
    currentPlayerIndex: number;
    currentCardIndex: number;
    dealtCards: Array<{ playerId: string; card: Card }>;
    blackJackFound?: { playerId: string; card: Card };
  };
};

export type PublicGameState = Omit<GameState, 'hands' | 'deck'> & {
  playerHand?: Card[]; // Only for the current player
  deck: Card[]; // Placeholder cards for clients, actual cards for host
};
