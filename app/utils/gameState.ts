import type { GameState, PublicGameState, Player, Card, Bid, Trick, GameOptions } from '../types/game';
import {
  createDeck,
  dealHands,
  getWinningCard,
  canPlayCard,
  canPlayCardWithOptions,
  getEffectiveSuit,
  selectDealerAndTeams,
  selectDealerOnly,
  findFirstBlackJackDealer
} from '../utils/gameLogic';

export type GameAction =
  | { type: 'INIT_GAME'; payload: { hostId: string; gameId: string; gameCode?: string } }
  | { type: 'ADD_PLAYER'; payload: { player: Player } }
  | { type: 'REMOVE_PLAYER'; payload: { playerId: string } }
  | { type: 'UPDATE_PLAYER_CONNECTION'; payload: { playerId: string; isConnected: boolean } }
  | { type: 'RENAME_PLAYER'; payload: { playerId: string; newName: string } }
  | { type: 'KICK_PLAYER'; payload: { playerId: string } }
  | { type: 'MOVE_PLAYER'; payload: { playerId: string; newPosition: 0 | 1 | 2 | 3 } }
  | { type: 'UPDATE_GAME_OPTIONS'; payload: { options: GameOptions } }
  | { type: 'START_GAME' }
  | { type: 'SELECT_DEALER' }
  | { type: 'DRAW_DEALER_CARD'; payload: { playerId: string; card: Card } }
  | { type: 'COMPLETE_DEALER_SELECTION' }
  | { type: 'PROCEED_TO_DEALING' }
  | { type: 'DEAL_CARDS' }
  | { type: 'PLACE_BID'; payload: { bid: Bid } }
  | { type: 'DEALER_DISCARD'; payload: { card: Card } }
  | { type: 'SET_TRUMP'; payload: { trump: Card['suit']; makerId: string; alone?: boolean } }
  | { type: 'PLAY_CARD'; payload: { card: Card; playerId: string } }
  | { type: 'COMPLETE_TRICK' }
  | { type: 'COMPLETE_HAND' }
  | { type: 'UPDATE_SCORES'; payload: { team0: number; team1: number } }
  | { type: 'NEXT_HAND' }
  | { type: 'SET_CURRENT_PLAYER'; payload: { playerId: string } }
  | { type: 'SET_PHASE'; payload: { phase: GameState['phase'] } }
  | { type: 'SYNC_STATE'; payload: { gameState: PublicGameState; playerHand?: Card[]; receivingPlayerId: string } };

const initialGameState: GameState = {
  id: '',
  players: [],
  phase: 'lobby',
  options: {
    teamSelection: 'predetermined',
    dealerSelection: 'random_cards',
    allowReneging: false,
    screwTheDealer: false,
    farmersHand: false
  },
  currentDealerId: '',
  deck: [],
  hands: {},
  bids: [],
  completedTricks: [],
  scores: { team0: 0, team1: 0 },
  handScores: { team0: 0, team1: 0 }
};

function getNextPlayer(currentPlayerId: string, players: Player[]): string {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) return players[0]?.id || '';

  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

function getNextDealer(currentDealerId: string, players: Player[]): string {
  return getNextPlayer(currentDealerId, players);
}

function getTeamId(position: number): 0 | 1 {
  return (position % 2) as 0 | 1;
}

function calculateHandScore(tricks: Trick[], makingTeam: 0 | 1, alone: boolean): { team0: number; team1: number } {
  const makingTeamTricks = tricks.filter(trick => {
    const winnerPosition = trick.winnerId ?
      parseInt(trick.winnerId.split('-')[1]) || 0 : 0;
    return getTeamId(winnerPosition) === makingTeam;
  }).length;

  const scores = { team0: 0, team1: 0 };

  if (makingTeamTricks === 5) {
    // Made all 5 tricks
    scores[`team${makingTeam}`] = alone ? 4 : 2;
  } else if (makingTeamTricks >= 3) {
    // Made the bid (3 or 4 tricks)
    scores[`team${makingTeam}`] = 1;
  } else {
    // Failed to make bid - opposing team gets 2 points
    const opposingTeam = makingTeam === 0 ? 1 : 0;
    scores[`team${opposingTeam}`] = 2;
  }

  return scores;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME':
      return {
        ...initialGameState,
        id: action.payload.gameId,
        gameCode: action.payload.gameCode,
        players: [{
          id: action.payload.hostId,
          name: 'Host',
          isHost: true,
          isConnected: true,
          position: 0,
          teamId: 0,
        }],
        currentDealerId: action.payload.hostId
      };

    case 'ADD_PLAYER': {
      const { player } = action.payload;
      const newPosition = state.players.length as 0 | 1 | 2 | 3;

      if (newPosition >= 4) {
        return state; // Game is full
      }

      const newPlayer: Player = {
        ...player,
        position: newPosition,
        teamId: getTeamId(newPosition)
      };

      return {
        ...state,
        players: [...state.players, newPlayer]
      };
    }

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.playerId)
      };

    case 'UPDATE_PLAYER_CONNECTION':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, isConnected: action.payload.isConnected }
            : p
        )
      };

    case 'START_GAME':
      if (state.players.length !== 4) {
        return state; // Need exactly 4 players
      }

      // If using predetermined teams and first black jack, skip dealer selection phase
      if (state.options.teamSelection === 'predetermined' && state.options.dealerSelection === 'first_black_jack') {
        const { dealer, arrangedPlayers } = findFirstBlackJackDealer(state.players);

        return {
          ...state,
          players: arrangedPlayers,
          currentDealerId: dealer.id,
          phase: 'team_summary'
        };
      } else {
        // Go to dealer selection phase for card-based selection
        return {
          ...state,
          phase: 'dealer_selection'
        };
      }

    case 'SELECT_DEALER': {
      // For first black jack method, we handle dealer selection immediately in START_GAME
      // This action is only used for random card selection method
      if (state.options.dealerSelection === 'first_black_jack') {
        return state; // This shouldn't happen
      }

      // Create a shuffled deck for card drawing
      const deck = createDeck();

      return {
        ...state,
        deck,
        dealerSelectionCards: {}
      };
    }

    case 'DRAW_DEALER_CARD': {
      const { playerId, card } = action.payload;

      const newDealerSelectionCards = {
        ...state.dealerSelectionCards,
        [playerId]: card
      };

      // Check if all 4 players have drawn cards
      if (Object.keys(newDealerSelectionCards).length === 4) {
        // Automatically complete dealer selection
        let dealer: Player;
        let arrangedPlayers: Player[];

        if (state.options.teamSelection === 'random_cards') {
          // Use cards to determine both dealer and teams
          const result = selectDealerAndTeams(state.players, newDealerSelectionCards);
          dealer = result.dealer;
          arrangedPlayers = result.arrangedPlayers;
        } else {
          // Use cards only for dealer selection, keep predetermined teams
          const result = selectDealerOnly(state.players, newDealerSelectionCards);
          dealer = result.dealer;
          arrangedPlayers = result.arrangedPlayers;
        }

        return {
          ...state,
          players: arrangedPlayers,
          currentDealerId: dealer.id,
          phase: 'team_summary',
          dealerSelectionCards: undefined // Clear the selection cards
        };
      }

      return {
        ...state,
        dealerSelectionCards: newDealerSelectionCards
      };
    }

    case 'COMPLETE_DEALER_SELECTION': {
      if (state.options.dealerSelection === 'first_black_jack') {
        // Use first black jack method
        const { dealer, arrangedPlayers } = findFirstBlackJackDealer(state.players);

        return {
          ...state,
          players: arrangedPlayers,
          currentDealerId: dealer.id,
          phase: 'team_summary',
          dealerSelectionCards: undefined
        };
      } else {
        // Use random card selection method
        if (!state.dealerSelectionCards || Object.keys(state.dealerSelectionCards).length !== 4) {
          return state; // Need all 4 players to have drawn cards
        }

        let dealer: Player;
        let arrangedPlayers: Player[];

        if (state.options.teamSelection === 'random_cards') {
          // Use cards to determine both dealer and teams
          const result = selectDealerAndTeams(state.players, state.dealerSelectionCards);
          dealer = result.dealer;
          arrangedPlayers = result.arrangedPlayers;
        } else {
          // Use cards only for dealer selection, keep predetermined teams
          const result = selectDealerOnly(state.players, state.dealerSelectionCards);
          dealer = result.dealer;
          arrangedPlayers = result.arrangedPlayers;
        }

        return {
          ...state,
          players: arrangedPlayers,
          currentDealerId: dealer.id,
          phase: 'team_summary',
          dealerSelectionCards: undefined // Clear the selection cards
        };
      }
    }

    case 'PROCEED_TO_DEALING':
      return {
        ...state,
        phase: 'dealing'
      };

    case 'DEAL_CARDS': {
      const deck = createDeck();
      const { hands, kitty, remainingDeck } = dealHands(deck);

      const playerHands: Record<string, Card[]> = {};
      state.players.forEach((player, index) => {
        playerHands[player.id] = hands[index];
      });

      return {
        ...state,
        deck: remainingDeck,
        hands: playerHands,
        kitty,
        phase: 'bidding_round1',
        bids: [],
        currentPlayerId: getNextPlayer(state.currentDealerId, state.players),
        trump: undefined,
        maker: undefined,
        turnedDownSuit: undefined
      };
    }

    case 'PLACE_BID': {
      const { bid } = action.payload;
      const newBids = [...state.bids, bid];

      let newPhase = state.phase;
      let trump = state.trump;
      let maker = state.maker;
      let currentPlayer = state.currentPlayerId;
      let turnedDownSuit = state.turnedDownSuit;
      let newHands = state.hands;

      if (state.phase === 'bidding_round1') {
        // Round 1: Can only order up/assist/take up the kitty suit, or pass
        if (bid.suit !== 'pass') {
          // Someone ordered up/assisted/took up the kitty suit
          trump = state.kitty!.suit;
          const player = state.players.find(p => p.id === bid.playerId);
          maker = {
            playerId: bid.playerId,
            teamId: player?.teamId || 0,
            alone: bid.alone || false
          };

          // If dealer took it up, they need to discard
          if (bid.playerId === state.currentDealerId) {
            // Add kitty to dealer's hand (will be handled in UI)
            if (newHands[bid.playerId]) {
              newHands = {
                ...newHands,
                [bid.playerId]: [...newHands[bid.playerId], state.kitty!]
              };
            }
          }

          newPhase = 'playing';
          currentPlayer = getNextPlayer(state.currentDealerId, state.players);
        } else {
          // Player passed, check if round 1 is complete
          const currentPlayerIndex = state.players.findIndex(p => p.id === bid.playerId);
          const dealerIndex = state.players.findIndex(p => p.id === state.currentDealerId);

          if (currentPlayerIndex === dealerIndex) {
            // Dealer passed, start round 2
            newPhase = 'bidding_round2';
            turnedDownSuit = state.kitty!.suit;
            currentPlayer = getNextPlayer(state.currentDealerId, state.players);
          } else {
            // Continue round 1
            currentPlayer = getNextPlayer(bid.playerId, state.players);
          }
        }
      } else if (state.phase === 'bidding_round2') {
        // Round 2: Can call any suit except the turned down suit, or pass
        if (bid.suit !== 'pass') {
          // Someone called a suit
          trump = bid.suit as Card['suit'];
          const player = state.players.find(p => p.id === bid.playerId);
          maker = {
            playerId: bid.playerId,
            teamId: player?.teamId || 0,
            alone: bid.alone || false
          };
          newPhase = 'playing';
          currentPlayer = getNextPlayer(state.currentDealerId, state.players);
        } else {
          // Player passed, check if round 2 is complete
          const currentPlayerIndex = state.players.findIndex(p => p.id === bid.playerId);
          const dealerIndex = state.players.findIndex(p => p.id === state.currentDealerId);

          if (currentPlayerIndex === dealerIndex) {
            // All players passed both rounds, deal new hand
            newPhase = 'dealing';
            currentPlayer = getNextDealer(state.currentDealerId, state.players);
          } else {
            // Continue round 2
            currentPlayer = getNextPlayer(bid.playerId, state.players);
          }
        }
      }

      return {
        ...state,
        bids: newBids,
        phase: newPhase,
        trump,
        maker,
        turnedDownSuit,
        currentPlayerId: currentPlayer,
        currentDealerId: newPhase === 'dealing' ? (currentPlayer || state.currentDealerId) : state.currentDealerId,
        hands: newHands
      };
    }

    case 'DEALER_DISCARD': {
      const { card } = action.payload;

      // Remove the discarded card from dealer's hand
      const newHands = {
        ...state.hands,
        [state.currentDealerId]: state.hands[state.currentDealerId]?.filter(c => c.id !== card.id) || []
      };

      return {
        ...state,
        hands: newHands,
        phase: 'playing',
        currentPlayerId: getNextPlayer(state.currentDealerId, state.players)
      };
    }

    case 'SET_TRUMP':
      return {
        ...state,
        trump: action.payload.trump,
        maker: {
          playerId: action.payload.makerId,
          teamId: state.players.find(p => p.id === action.payload.makerId)?.teamId || 0,
          alone: action.payload.alone || false
        },
        phase: 'playing'
      };

    case 'PLAY_CARD': {
      const { card, playerId } = action.payload;

      if (!state.currentTrick) {
        // Start new trick
        const newTrick: Trick = {
          id: crypto.randomUUID(),
          cards: [{ card, playerId }],
          leaderId: playerId
        };

        return {
          ...state,
          currentTrick: newTrick,
          hands: {
            ...state.hands,
            [playerId]: state.hands[playerId].filter(c => c.id !== card.id)
          },
          currentPlayerId: getNextPlayer(playerId, state.players)
        };
      } else {
        // Add to existing trick
        const updatedTrick = {
          ...state.currentTrick,
          cards: [...state.currentTrick.cards, { card, playerId }]
        };

        const newHands = {
          ...state.hands,
          [playerId]: state.hands[playerId].filter(c => c.id !== card.id)
        };

        // Check if trick is complete (4 cards)
        if (updatedTrick.cards.length === 4) {
          const leadSuit = state.trump ?
            getEffectiveSuit(updatedTrick.cards[0].card, state.trump) :
            updatedTrick.cards[0].card.suit;

          const winningPlay = getWinningCard(updatedTrick.cards, state.trump!, leadSuit);
          updatedTrick.winnerId = winningPlay.playerId;

          const newCompletedTricks = [...state.completedTricks, updatedTrick];

          // Check if hand is complete (5 tricks)
          if (newCompletedTricks.length === 5) {
            return {
              ...state,
              hands: newHands,
              currentTrick: undefined,
              completedTricks: newCompletedTricks,
              phase: 'hand_complete',
              currentPlayerId: winningPlay.playerId
            };
          } else {
            return {
              ...state,
              hands: newHands,
              currentTrick: undefined,
              completedTricks: newCompletedTricks,
              phase: 'trick_complete',
              currentPlayerId: winningPlay.playerId
            };
          }
        } else {
          // Continue trick
          return {
            ...state,
            hands: newHands,
            currentTrick: updatedTrick,
            currentPlayerId: getNextPlayer(playerId, state.players)
          };
        }
      }
    }

    case 'COMPLETE_TRICK':
      return {
        ...state,
        phase: 'playing'
      };

    case 'COMPLETE_HAND': {
      if (!state.maker) return state;

      const handScores = calculateHandScore(
        state.completedTricks,
        state.maker.teamId,
        state.maker.alone
      );

      const newScores = {
        team0: state.scores.team0 + handScores.team0,
        team1: state.scores.team1 + handScores.team1
      };

      // Check for game end (first to 10 points wins)
      const gameComplete = newScores.team0 >= 10 || newScores.team1 >= 10;

      return {
        ...state,
        scores: newScores,
        handScores,
        phase: gameComplete ? 'game_complete' : 'dealing',
        currentDealerId: getNextDealer(state.currentDealerId, state.players),
        completedTricks: [],
        trump: undefined,
        maker: undefined,
        bids: [],
        hands: gameComplete ? state.hands : {},
        currentTrick: undefined
      };
    }

    case 'UPDATE_SCORES':
      return {
        ...state,
        scores: action.payload
      };

    case 'NEXT_HAND':
      return {
        ...state,
        phase: 'dealing',
        currentDealerId: getNextDealer(state.currentDealerId, state.players),
        completedTricks: [],
        trump: undefined,
        maker: undefined,
        bids: [],
        hands: {},
        currentTrick: undefined,
        turnedDownSuit: undefined,
        handScores: { team0: 0, team1: 0 }
      };

    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayerId: action.payload.playerId
      };

    case 'SET_PHASE':
      return {
        ...state,
        phase: action.payload.phase
      };

    case 'SYNC_STATE': {
      const { gameState, playerHand, receivingPlayerId } = action.payload;


      return {
        ...state,
        id: gameState.id,
        players: gameState.players,
        phase: gameState.phase,
        options: gameState.options,
        currentDealerId: gameState.currentDealerId,
        currentPlayerId: gameState.currentPlayerId,
        trump: gameState.trump,
        kitty: gameState.kitty,
        turnedDownSuit: gameState.turnedDownSuit,
        bids: gameState.bids,
        currentTrick: gameState.currentTrick,
        completedTricks: gameState.completedTricks,
        scores: gameState.scores,
        handScores: gameState.handScores,
        maker: gameState.maker,
        dealerSelectionCards: gameState.dealerSelectionCards,
        hands: playerHand ? { [receivingPlayerId]: playerHand } : {},
        deck: gameState.deck
      };
    }

    case 'RENAME_PLAYER':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, name: action.payload.newName }
            : p
        )
      };

    case 'KICK_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.playerId)
      };

    case 'MOVE_PLAYER': {
      const { playerId, newPosition } = action.payload;
      const playerToMove = state.players.find(p => p.id === playerId);
      if (!playerToMove) return state;

      // Find if there's already a player at the target position
      const playerAtTarget = state.players.find(p => p.position === newPosition);

      const updatedPlayers = state.players.map(p => {
        if (p.id === playerId) {
          // Move the player to new position and update team
          return {
            ...p,
            position: newPosition,
            teamId: (newPosition % 2) as 0 | 1
          };
        } else if (playerAtTarget && p.id === playerAtTarget.id) {
          // Swap with the player at target position
          return {
            ...p,
            position: playerToMove.position,
            teamId: (playerToMove.position % 2) as 0 | 1
          };
        }
        return p;
      });

      return {
        ...state,
        players: updatedPlayers
      };
    }

    case 'UPDATE_GAME_OPTIONS': {
      // Only allow changing options in lobby phase
      if (state.phase !== 'lobby') {
        return state;
      }

      return {
        ...state,
        options: action.payload.options
      };
    }

    default:
      return state;
  }
}

export function createPublicGameState(gameState: GameState, forPlayerId?: string): PublicGameState {
  // Create placeholder cards for the deck - clients only see placeholders for security
  const placeholderCards: Card[] = Array.from({ length: gameState.deck.length }, (_, index) => ({
    id: `placeholder-${index}`,
    suit: 'spades' as const,
    value: 'A' as const
  }));

  const publicState: PublicGameState = {
    id: gameState.id,
    players: gameState.players,
    phase: gameState.phase,
    options: gameState.options,
    currentDealerId: gameState.currentDealerId,
    currentPlayerId: gameState.currentPlayerId,
    trump: gameState.trump,
    kitty: gameState.kitty,
    turnedDownSuit: gameState.turnedDownSuit,
    bids: gameState.bids,
    currentTrick: gameState.currentTrick,
    completedTricks: gameState.completedTricks,
    scores: gameState.scores,
    handScores: gameState.handScores,
    maker: gameState.maker,
    dealerSelectionCards: gameState.dealerSelectionCards,
    deck: placeholderCards,
  };

  // Include player's hand if specified
  if (forPlayerId && gameState.hands[forPlayerId]) {
    publicState.playerHand = gameState.hands[forPlayerId];
  }

  return publicState;
}
