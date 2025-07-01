import type { GameState, PublicGameState, Player, Card, Bid, Trick } from '../types/game';
import { createDeck, dealHands, getWinningCard, canPlayCard, getEffectiveSuit } from '../utils/gameLogic';
import { v4 as uuidv4 } from 'uuid';

export type GameAction =
  | { type: 'INIT_GAME'; payload: { hostId: string; gameId: string } }
  | { type: 'ADD_PLAYER'; payload: { player: Player } }
  | { type: 'REMOVE_PLAYER'; payload: { playerId: string } }
  | { type: 'UPDATE_PLAYER_CONNECTION'; payload: { playerId: string; isConnected: boolean } }
  | { type: 'UPDATE_PLAYER_ID_AND_CONNECTION'; payload: { oldPlayerId: string; newPlayerId: string; isConnected: boolean } }
  | { type: 'RENAME_PLAYER'; payload: { playerId: string; newName: string } }
  | { type: 'KICK_PLAYER'; payload: { playerId: string } }
  | { type: 'MOVE_PLAYER'; payload: { playerId: string; newPosition: 0 | 1 | 2 | 3 } }
  | { type: 'START_GAME' }
  | { type: 'DEAL_CARDS' }
  | { type: 'PLACE_BID'; payload: { bid: Bid } }
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

    case 'UPDATE_PLAYER_ID_AND_CONNECTION': {
      const { oldPlayerId, newPlayerId, isConnected } = action.payload;
      
      // Update player ID and connection status
      const updatedPlayers = state.players.map(p =>
        p.id === oldPlayerId
          ? { ...p, id: newPlayerId, isConnected }
          : p
      );

      // Update any game state references to the old player ID
      const updatedHands = { ...state.hands };
      if (updatedHands[oldPlayerId]) {
        updatedHands[newPlayerId] = updatedHands[oldPlayerId];
        delete updatedHands[oldPlayerId];
      }

      return {
        ...state,
        players: updatedPlayers,
        hands: updatedHands,
        currentDealerId: state.currentDealerId === oldPlayerId ? newPlayerId : state.currentDealerId,
        currentPlayerId: state.currentPlayerId === oldPlayerId ? newPlayerId : state.currentPlayerId,
        bids: state.bids.map(bid => 
          bid.playerId === oldPlayerId ? { ...bid, playerId: newPlayerId } : bid
        ),
        completedTricks: state.completedTricks.map(trick => ({
          ...trick,
          winnerId: trick.winnerId === oldPlayerId ? newPlayerId : trick.winnerId,
          leaderId: trick.leaderId === oldPlayerId ? newPlayerId : trick.leaderId,
          cards: trick.cards.map(card => 
            card.playerId === oldPlayerId ? { ...card, playerId: newPlayerId } : card
          )
        })),
        currentTrick: state.currentTrick ? {
          ...state.currentTrick,
          winnerId: state.currentTrick.winnerId === oldPlayerId ? newPlayerId : state.currentTrick.winnerId,
          leaderId: state.currentTrick.leaderId === oldPlayerId ? newPlayerId : state.currentTrick.leaderId,
          cards: state.currentTrick.cards.map(card => 
            card.playerId === oldPlayerId ? { ...card, playerId: newPlayerId } : card
          )
        } : undefined,
        maker: state.maker?.playerId === oldPlayerId 
          ? { ...state.maker, playerId: newPlayerId }
          : state.maker
      };
    }

    case 'START_GAME':
      if (state.players.length !== 4) {
        return state; // Need exactly 4 players
      }

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
        phase: 'bidding',
        bids: [],
        currentPlayerId: getNextPlayer(state.currentDealerId, state.players),
        trump: undefined,
        maker: undefined
      };
    }

    case 'PLACE_BID': {
      const { bid } = action.payload;
      const newBids = [...state.bids, bid];
      
      // Check if bidding is complete
      const passCount = newBids.filter(b => b.suit === 'pass').length;
      const validBid = newBids.find(b => b.suit !== 'pass');
      
      let newPhase = state.phase;
      let trump = state.trump;
      let maker = state.maker;
      let currentPlayer = state.currentPlayerId;

      if (validBid && bid.suit !== 'pass') {
        // Someone made a bid
        trump = bid.suit as Card['suit'];
        const player = state.players.find(p => p.id === bid.playerId);
        maker = {
          playerId: bid.playerId,
          teamId: player?.teamId || 0,
          alone: bid.alone || false
        };
        newPhase = 'playing';
        currentPlayer = getNextPlayer(state.currentDealerId, state.players);
      } else if (passCount === 4) {
        // All players passed, deal new hand
        newPhase = 'dealing';
        currentPlayer = getNextDealer(state.currentDealerId, state.players);
      } else {
        // Continue bidding
        currentPlayer = getNextPlayer(bid.playerId, state.players);
      }

      return {
        ...state,
        bids: newBids,
        phase: newPhase,
        trump,
        maker,
        currentPlayerId: currentPlayer,
        currentDealerId: newPhase === 'dealing' ? currentPlayer : state.currentDealerId
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
          id: uuidv4(),
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
        currentDealerId: gameState.currentDealerId,
        currentPlayerId: gameState.currentPlayerId,
        trump: gameState.trump,
        kitty: gameState.kitty,
        bids: gameState.bids,
        currentTrick: gameState.currentTrick,
        completedTricks: gameState.completedTricks,
        scores: gameState.scores,
        handScores: gameState.handScores,
        maker: gameState.maker,
        hands: playerHand ? { [receivingPlayerId]: playerHand } : {},
        deck: [] // Client doesn't need the full deck
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

    case 'UPDATE_PLAYER_ID_AND_CONNECTION': {
      const { oldPlayerId, newPlayerId, isConnected } = action.payload;
      
      const updatedPlayers = state.players
        .filter(p => p.id !== oldPlayerId) // Remove old player entry
        .map(p => {
          if (p.id === newPlayerId) {
            // Update existing player ID
            return {
              ...p,
              id: newPlayerId,
              isConnected
            };
          }
          return p;
        });

      return {
        ...state,
        players: updatedPlayers
      };
    }

    default:
      return state;
  }
}

export function createPublicGameState(gameState: GameState, forPlayerId?: string): PublicGameState {
  const publicState: PublicGameState = {
    id: gameState.id,
    players: gameState.players,
    phase: gameState.phase,
    currentDealerId: gameState.currentDealerId,
    currentPlayerId: gameState.currentPlayerId,
    trump: gameState.trump,
    kitty: gameState.kitty,
    bids: gameState.bids,
    currentTrick: gameState.currentTrick,
    completedTricks: gameState.completedTricks,
    scores: gameState.scores,
    handScores: gameState.handScores,
    maker: gameState.maker,
    deckSize: gameState.deck.length
  };

  // Include player's hand if specified
  if (forPlayerId && gameState.hands[forPlayerId]) {
    publicState.playerHand = gameState.hands[forPlayerId];
  }

  return publicState;
}
