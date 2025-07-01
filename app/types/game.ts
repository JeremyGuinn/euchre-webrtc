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
  | 'dealing'
  | 'bidding'
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

export type GameState = {
  id: string;
  players: Player[];
  phase: GamePhase;
  currentDealerId: string;
  currentPlayerId?: string;
  deck: Card[];
  hands: Record<string, Card[]>; // Only on host
  trump?: Card['suit'];
  kitty?: Card; // The turned-up card
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
  maker?: {
    playerId: string;
    teamId: 0 | 1;
    alone: boolean;
  };
};

export type PublicGameState = Omit<GameState, 'hands' | 'deck'> & {
  playerHand?: Card[]; // Only for the current player
  deckSize: number;
};
