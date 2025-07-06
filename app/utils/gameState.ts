import type {
  Bid,
  Card,
  GameOptions,
  GameState,
  Player,
  PublicGameState,
  Trick,
} from '~/types/game';
import {
  createDeck,
  dealHands,
  findFirstBlackJackDealer,
  getEffectiveSuit,
  getWinningCard,
  isFarmersHand,
  performFarmersHandSwap,
  selectDealerAndTeams,
  selectDealerOnly,
} from '~/utils/gameLogic';

export type GameAction =
  | {
      type: 'INIT_GAME';
      payload: { hostId: string; gameId: string; gameCode?: string };
    }
  | { type: 'ADD_PLAYER'; payload: { player: Player } }
  | { type: 'REMOVE_PLAYER'; payload: { playerId: string } }
  | {
      type: 'UPDATE_PLAYER_CONNECTION';
      payload: { playerId: string; isConnected: boolean };
    }
  | {
      type: 'RECONNECT_PLAYER';
      payload: { oldPlayerId: string; newPlayerId: string; playerName: string };
    }
  | { type: 'RENAME_PLAYER'; payload: { playerId: string; newName: string } }
  | { type: 'RENAME_TEAM'; payload: { teamId: 0 | 1; newName: string } }
  | { type: 'KICK_PLAYER'; payload: { playerId: string } }
  | {
      type: 'MOVE_PLAYER';
      payload: { playerId: string; newPosition: 0 | 1 | 2 | 3 };
    }
  | { type: 'UPDATE_GAME_OPTIONS'; payload: { options: GameOptions } }
  | { type: 'START_GAME' }
  | { type: 'SELECT_DEALER' }
  | { type: 'DRAW_DEALER_CARD'; payload: { playerId: string; card: Card } }
  | {
      type: 'DEALER_CARD_DEALT';
      payload: {
        playerId: string;
        card: Card;
        cardIndex: number;
        isBlackJack: boolean;
      };
    }
  | { type: 'COMPLETE_BLACKJACK_DEALER_SELECTION' }
  | { type: 'PROCEED_TO_DEALING' }
  | { type: 'DEAL_CARDS' }
  | { type: 'FARMERS_HAND_DETECTED'; payload: { playerId: string } }
  | {
      type: 'FARMERS_HAND_SWAP';
      payload: { playerId: string; cardsToSwap: Card[] };
    }
  | { type: 'FARMERS_HAND_DECLINED'; payload: { playerId: string } }
  | { type: 'PLACE_BID'; payload: { bid: Bid } }
  | { type: 'DEALER_DISCARD'; payload: { card: Card } }
  | {
      type: 'SET_TRUMP';
      payload: { trump: Card['suit']; makerId: string; alone?: boolean };
    }
  | { type: 'PLAY_CARD'; payload: { card: Card; playerId: string } }
  | { type: 'COMPLETE_TRICK' }
  | { type: 'COMPLETE_HAND' }
  | { type: 'NEXT_HAND' }
  | { type: 'SET_CURRENT_PLAYER'; payload: { playerId: string } }
  | { type: 'SET_PHASE'; payload: { phase: GameState['phase'] } }
  | { type: 'RESTORE_GAME_STATE'; payload: { gameState: GameState } }
  | {
      type: 'SYNC_STATE';
      payload: {
        gameState: PublicGameState;
        playerHand?: Card[];
        receivingPlayerId: string;
      };
    };

const initialGameState: GameState = {
  id: '',
  players: [],
  phase: 'lobby',
  options: {
    teamSelection: 'predetermined',
    dealerSelection: 'random_cards',
    allowReneging: false,
    screwTheDealer: false,
    farmersHand: false,
  },
  currentDealerId: '',
  deck: [],
  hands: {},
  bids: [],
  completedTricks: [],
  scores: { team0: 0, team1: 0 },
  handScores: { team0: 0, team1: 0 },
  teamNames: { team0: 'Team 1', team1: 'Team 2' },
};

function getNextPlayer(currentPlayerId: string, players: Player[]): string {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) return players[0]?.id || '';

  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

function getNextPlayerWithAlone(
  currentPlayerId: string,
  players: Player[],
  maker?: { playerId: string; teamId: 0 | 1; alone: boolean }
): string {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) return players[0]?.id || '';

  // If someone is going alone, skip their teammate
  if (maker?.alone) {
    const makerPlayer = players.find(p => p.id === maker.playerId);
    if (makerPlayer) {
      const teammateId = players.find(
        p => p.teamId === makerPlayer.teamId && p.id !== makerPlayer.id
      )?.id;

      // Find next player, skipping the teammate
      let nextIndex = (currentIndex + 1) % players.length;
      let nextPlayer = players[nextIndex];

      // If the next player is the teammate, skip them
      if (nextPlayer.id === teammateId) {
        nextIndex = (nextIndex + 1) % players.length;
        nextPlayer = players[nextIndex];
      }

      return nextPlayer.id;
    }
  }

  // Normal turn order
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

function getExpectedTrickSize(maker?: {
  playerId: string;
  teamId: 0 | 1;
  alone: boolean;
}): number {
  // If someone is going alone, only 3 players participate
  return maker?.alone ? 3 : 4;
}

function getNextDealer(currentDealerId: string, players: Player[]): string {
  return getNextPlayer(currentDealerId, players);
}

function getTeamId(position: number): 0 | 1 {
  return (position % 2) as 0 | 1;
}

function calculateHandScore(
  tricks: Trick[],
  players: Player[],
  makingTeam: 0 | 1,
  alone: boolean
): { team0: number; team1: number } {
  const makingTeamTricks = tricks.filter(trick => {
    if (!trick.winnerId) return false;
    const winner = players.find(p => p.id === trick.winnerId);
    return winner?.teamId === makingTeam;
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
        players: [
          {
            id: action.payload.hostId,
            name: 'Host',
            isHost: true,
            isConnected: true,
            position: 0,
            teamId: 0,
          },
        ],
        currentDealerId: action.payload.hostId,
      };

    case 'ADD_PLAYER': {
      const { player } = action.payload;

      // Find the first available position (0-3)
      const occupiedPositions = new Set(state.players.map(p => p.position));
      const availablePosition = ([0, 1, 2, 3] as const).find(
        pos => !occupiedPositions.has(pos)
      );

      if (availablePosition === undefined) {
        return state; // Game is full
      }

      const newPlayer: Player = {
        ...player,
        position: availablePosition,
        teamId: getTeamId(availablePosition),
      };

      return {
        ...state,
        players: [...state.players, newPlayer],
      };
    }

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.playerId),
      };

    case 'UPDATE_PLAYER_CONNECTION':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, isConnected: action.payload.isConnected }
            : p
        ),
      };

    case 'RECONNECT_PLAYER': {
      const { oldPlayerId, newPlayerId, playerName } = action.payload;

      // Find the player to reconnect
      const playerToReconnect = state.players.find(p => p.id === oldPlayerId);
      if (!playerToReconnect) {
        return state; // Player not found
      }

      // Update the player ID and mark as connected
      const updatedPlayer: Player = {
        ...playerToReconnect,
        id: newPlayerId,
        name: playerName,
        isConnected: true,
      };

      // Update all references to the old player ID throughout the game state
      const newHands: Record<string, Card[]> = { ...state.hands };
      if (state.hands[oldPlayerId]) {
        newHands[newPlayerId] = state.hands[oldPlayerId];
        delete newHands[oldPlayerId];
      }

      const newDealerSelectionCards = state.dealerSelectionCards
        ? { ...state.dealerSelectionCards }
        : undefined;
      if (
        newDealerSelectionCards &&
        state.dealerSelectionCards?.[oldPlayerId]
      ) {
        newDealerSelectionCards[newPlayerId] =
          state.dealerSelectionCards[oldPlayerId];
        delete newDealerSelectionCards[oldPlayerId];
      }

      const updatedState: GameState = {
        ...state,
        players: state.players.map(p =>
          p.id === oldPlayerId ? updatedPlayer : p
        ),
        // Update current dealer if it was the reconnecting player
        currentDealerId:
          state.currentDealerId === oldPlayerId
            ? newPlayerId
            : state.currentDealerId,
        // Update current player if it was the reconnecting player
        currentPlayerId:
          state.currentPlayerId === oldPlayerId
            ? newPlayerId
            : state.currentPlayerId,
        // Update farmer's hand player if it was the reconnecting player
        farmersHandPlayer:
          state.farmersHandPlayer === oldPlayerId
            ? newPlayerId
            : state.farmersHandPlayer,
        // Update hands mapping
        hands: newHands,
        // Update bids to reference new player ID
        bids: state.bids.map(bid =>
          bid.playerId === oldPlayerId ? { ...bid, playerId: newPlayerId } : bid
        ),
        // Update maker if it was the reconnecting player
        maker:
          state.maker?.playerId === oldPlayerId
            ? { ...state.maker, playerId: newPlayerId }
            : state.maker,
        // Update current trick if the reconnecting player was involved
        currentTrick: state.currentTrick
          ? {
              ...state.currentTrick,
              leaderId:
                state.currentTrick.leaderId === oldPlayerId
                  ? newPlayerId
                  : state.currentTrick.leaderId,
              winnerId:
                state.currentTrick.winnerId === oldPlayerId
                  ? newPlayerId
                  : state.currentTrick.winnerId,
              cards: state.currentTrick.cards.map(card =>
                card.playerId === oldPlayerId
                  ? { ...card, playerId: newPlayerId }
                  : card
              ),
            }
          : state.currentTrick,
        // Update completed tricks
        completedTricks: state.completedTricks.map(trick => ({
          ...trick,
          leaderId:
            trick.leaderId === oldPlayerId ? newPlayerId : trick.leaderId,
          winnerId:
            trick.winnerId === oldPlayerId ? newPlayerId : trick.winnerId,
          cards: trick.cards.map(card =>
            card.playerId === oldPlayerId
              ? { ...card, playerId: newPlayerId }
              : card
          ),
        })),
        // Update dealer selection cards if they exist
        dealerSelectionCards: newDealerSelectionCards,
      };

      return updatedState;
    }

    case 'START_GAME':
      if (state.players.length !== 4) {
        return state; // Need exactly 4 players
      }

      // For predetermined dealer, skip dealer selection and go directly to team summary
      if (state.options.dealerSelection === 'predetermined_first_dealer') {
        const predeterminedDealerId = state.options.predeterminedFirstDealerId;

        if (!predeterminedDealerId) {
          return state;
        }

        // Validate the dealer exists
        const dealer = state.players.find(p => p.id === predeterminedDealerId);
        if (!dealer) {
          return state;
        }

        // Arrange players so the predetermined dealer is at position 0
        const arrangedPlayers: Player[] = [];
        const dealerOriginalPosition = dealer.position;

        // Rotate positions so dealer is at position 0
        state.players.forEach(player => {
          const newPosition = ((player.position - dealerOriginalPosition + 4) %
            4) as 0 | 1 | 2 | 3;
          arrangedPlayers[newPosition] = {
            ...player,
            position: newPosition,
            teamId: getTeamId(newPosition),
          };
        });

        // Set the dealer and move to team summary phase
        return {
          ...state,
          players: arrangedPlayers,
          currentDealerId: predeterminedDealerId,
          phase: 'team_summary',
          deck: createDeck(),
        };
      }

      // For other dealer selection methods, go to dealer selection phase
      return {
        ...state,
        phase: 'dealer_selection',
      };
    case 'SELECT_DEALER': {
      // For predetermined dealer, skip dealer selection and go directly to dealing
      if (state.options.dealerSelection === 'predetermined_first_dealer') {
        const predeterminedDealerId = state.options.predeterminedFirstDealerId;

        if (!predeterminedDealerId) {
          return state;
        }

        // Validate the dealer exists
        const dealer = state.players.find(p => p.id === predeterminedDealerId);
        if (!dealer) {
          return state;
        }

        // Set the dealer and move to team summary phase
        return {
          ...state,
          currentDealerId: predeterminedDealerId,
          phase: 'team_summary',
          deck: createDeck(),
        };
      }

      // Create a shuffled deck for card drawing/dealing
      const deck = createDeck();

      // Initialize dealer selection state based on method
      if (state.options.dealerSelection === 'first_black_jack') {
        return {
          ...state,
          deck,
          firstBlackJackDealing: {
            currentPlayerIndex: 0,
            currentCardIndex: 0,
            dealtCards: [],
          },
        };
      } else {
        // Random cards method
        return {
          ...state,
          deck,
          dealerSelectionCards: {},
        };
      }
    }

    case 'DRAW_DEALER_CARD': {
      const { playerId, card } = action.payload;

      const newDealerSelectionCards = {
        ...state.dealerSelectionCards,
        [playerId]: card,
      };

      // Check if all 4 players have drawn cards
      if (Object.keys(newDealerSelectionCards).length === 4) {
        // Automatically complete dealer selection
        let dealer: Player;
        let arrangedPlayers: Player[];

        if (state.options.teamSelection === 'random_cards') {
          // Use cards to determine both dealer and teams
          const result = selectDealerAndTeams(
            state.players,
            newDealerSelectionCards
          );
          dealer = result.dealer;
          arrangedPlayers = result.arrangedPlayers;
        } else {
          // Use cards only for dealer selection, keep predetermined teams
          const result = selectDealerOnly(
            state.players,
            newDealerSelectionCards
          );
          dealer = result.dealer;
          arrangedPlayers = result.arrangedPlayers;
        }

        return {
          ...state,
          players: arrangedPlayers,
          currentDealerId: dealer.id,
          dealerSelectionCards: newDealerSelectionCards, // displayed in the team_summary display
          phase: 'team_summary',
        };
      }

      return {
        ...state,
        dealerSelectionCards: newDealerSelectionCards,
      };
    }

    case 'DEALER_CARD_DEALT': {
      const { playerId, card, cardIndex, isBlackJack } = action.payload;

      // Add the dealt card to the dealing state
      const currentDealing = state.firstBlackJackDealing || {
        currentPlayerIndex: 0,
        currentCardIndex: 0,
        dealtCards: [],
      };

      const updatedDealing = {
        currentPlayerIndex:
          (currentDealing.currentPlayerIndex + 1) % state.players.length,
        currentCardIndex: cardIndex + 1,
        dealtCards: [...currentDealing.dealtCards, { playerId, card }],
        blackJackFound: isBlackJack
          ? { playerId, card }
          : currentDealing.blackJackFound,
      };

      return {
        ...state,
        firstBlackJackDealing: updatedDealing,
      };
    }

    case 'COMPLETE_BLACKJACK_DEALER_SELECTION': {
      if (!state.firstBlackJackDealing?.blackJackFound) {
        return state; // No black jack found yet
      }

      const { dealer, arrangedPlayers } = findFirstBlackJackDealer(
        state.deck,
        state.players
      );

      return {
        ...state,
        players: arrangedPlayers,
        currentDealerId: dealer.id,
        phase: 'team_summary',
      };
    }

    case 'PROCEED_TO_DEALING':
      return {
        ...state,
        phase: 'dealing_animation',
        dealerSelectionCards: undefined,
      };

    case 'DEAL_CARDS': {
      const deck = createDeck();
      const { hands, kitty, remainingDeck } = dealHands(deck);

      const playerHands: Record<string, Card[]> = {};
      state.players.forEach((player, index) => {
        playerHands[player.id] = hands[index];
      });

      // Check for farmer's hand if the option is enabled
      let nextPhase: GameState['phase'] = 'bidding_round1';
      let farmersHandPlayer: string | undefined = undefined;
      let currentPlayerId = getNextPlayer(state.currentDealerId, state.players);

      if (state.options.farmersHand) {
        // Find the first player with a farmer's hand
        const playerWithFarmersHand = state.players.find(player => {
          const hand = playerHands[player.id];
          return hand && isFarmersHand(hand);
        });

        if (playerWithFarmersHand) {
          nextPhase = 'farmers_hand_swap';
          farmersHandPlayer = playerWithFarmersHand.id;
          currentPlayerId = playerWithFarmersHand.id;
        }
      }

      return {
        ...state,
        deck: remainingDeck,
        hands: playerHands,
        kitty,
        phase: nextPhase,
        bids: [],
        currentPlayerId,
        trump: undefined,
        maker: undefined,
        turnedDownSuit: undefined,
        farmersHandPlayer,
      };
    }

    case 'FARMERS_HAND_DETECTED': {
      const { playerId } = action.payload;
      return {
        ...state,
        phase: 'farmers_hand_swap',
        farmersHandPlayer: playerId,
        currentPlayerId: playerId,
      };
    }

    case 'FARMERS_HAND_SWAP': {
      const { playerId, cardsToSwap } = action.payload;

      if (
        !state.kitty ||
        !state.farmersHandPlayer ||
        state.farmersHandPlayer !== playerId
      ) {
        return state;
      }

      const playerHand = state.hands[playerId];
      if (!playerHand) {
        return state;
      }

      // Perform the swap
      const { newHand, newKitty, newRemainingDeck } = performFarmersHandSwap(
        playerHand,
        cardsToSwap,
        state.kitty,
        state.deck
      );

      return {
        ...state,
        hands: {
          ...state.hands,
          [playerId]: newHand,
        },
        kitty: newKitty,
        deck: newRemainingDeck,
        phase: 'bidding_round1',
        currentPlayerId: getNextPlayer(state.currentDealerId, state.players),
        farmersHandPlayer: undefined,
      };
    }

    case 'FARMERS_HAND_DECLINED': {
      const { playerId } = action.payload;

      if (!state.farmersHandPlayer || state.farmersHandPlayer !== playerId) {
        return state;
      }

      return {
        ...state,
        phase: 'bidding_round1',
        currentPlayerId: getNextPlayer(state.currentDealerId, state.players),
        farmersHandPlayer: undefined,
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
            alone: bid.alone || false,
          };

          if (newHands[state.currentDealerId]) {
            newHands = {
              ...newHands,
              [state.currentDealerId]: [
                ...newHands[state.currentDealerId],
                state.kitty!,
              ],
            };
          }

          // Check if dealer is sitting out due to going alone
          const dealerPlayer = state.players.find(
            p => p.id === state.currentDealerId
          );
          const isDealerSittingOut =
            maker.alone &&
            maker.playerId !== state.currentDealerId &&
            dealerPlayer?.teamId === maker.teamId;

          if (isDealerSittingOut) {
            // Skip dealer discard phase and go straight to playing
            newPhase = 'playing';
            currentPlayer = getNextPlayerWithAlone(
              state.currentDealerId,
              state.players,
              maker
            );
          } else {
            // Go to dealer discard phase
            newPhase = 'dealer_discard';
            currentPlayer = state.currentDealerId;
          }
        } else {
          // Player passed, check if round 1 is complete
          const currentPlayerIndex = state.players.findIndex(
            p => p.id === bid.playerId
          );
          const dealerIndex = state.players.findIndex(
            p => p.id === state.currentDealerId
          );

          if (currentPlayerIndex === dealerIndex) {
            // Dealer passed, start round 2
            newPhase = 'bidding_round2';
            turnedDownSuit = state.kitty!.suit;
            currentPlayer = getNextPlayerWithAlone(
              state.currentDealerId,
              state.players,
              maker
            );
          } else {
            // Continue round 1
            currentPlayer = getNextPlayerWithAlone(
              bid.playerId,
              state.players,
              maker
            );
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
            alone: bid.alone || false,
          };
          newPhase = 'playing';
          currentPlayer = getNextPlayerWithAlone(
            state.currentDealerId,
            state.players,
            maker
          );
        } else {
          // Player passed, check if round 2 is complete
          const currentPlayerIndex = state.players.findIndex(
            p => p.id === bid.playerId
          );
          const dealerIndex = state.players.findIndex(
            p => p.id === state.currentDealerId
          );

          if (currentPlayerIndex === dealerIndex) {
            // Dealer passed in round 2
            if (state.options.screwTheDealer) {
              // With screw the dealer, dealer cannot pass in round 2
              // This should not happen in the UI, but handle it gracefully
              return state; // Don't process the bid
            } else {
              // Standard rules: All players passed both rounds, deal new hand
              newPhase = 'dealing_animation';
              currentPlayer = getNextDealer(
                state.currentDealerId,
                state.players
              );
            }
          } else {
            // Continue round 2
            currentPlayer = getNextPlayerWithAlone(
              bid.playerId,
              state.players,
              maker
            );
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
        currentDealerId:
          newPhase === 'dealing_animation'
            ? currentPlayer || state.currentDealerId
            : state.currentDealerId,
        hands: newPhase === 'dealing_animation' ? {} : newHands,
      };
    }

    case 'DEALER_DISCARD': {
      const { card } = action.payload;

      // Remove the discarded card from dealer's hand
      const newHands = {
        ...state.hands,
        [state.currentDealerId]:
          state.hands[state.currentDealerId]?.filter(c => c.id !== card.id) ||
          [],
      };

      return {
        ...state,
        hands: newHands,
        phase: 'playing',
        currentPlayerId: getNextPlayerWithAlone(
          state.currentDealerId,
          state.players,
          state.maker
        ),
      };
    }

    case 'SET_TRUMP':
      return {
        ...state,
        trump: action.payload.trump,
        maker: {
          playerId: action.payload.makerId,
          teamId:
            state.players.find(p => p.id === action.payload.makerId)?.teamId ||
            0,
          alone: action.payload.alone || false,
        },
        phase: 'playing',
      };

    case 'PLAY_CARD': {
      const { card, playerId } = action.payload;

      if (!state.currentTrick) {
        const newTrick: Trick = {
          id: crypto.randomUUID(),
          cards: [{ card, playerId }],
          leaderId: playerId,
        };

        return {
          ...state,
          currentTrick: newTrick,
          hands: {
            ...state.hands,
            [playerId]: state.hands[playerId].filter(c => c.id !== card.id),
          },
          currentPlayerId: getNextPlayerWithAlone(
            playerId,
            state.players,
            state.maker
          ),
        };
      }

      const updatedTrick = {
        ...state.currentTrick,
        cards: [...state.currentTrick.cards, { card, playerId }],
      };

      const newHands = {
        ...state.hands,
        [playerId]: state.hands[playerId].filter(c => c.id !== card.id),
      };

      const expectedTrickSize = getExpectedTrickSize(state.maker);

      if (updatedTrick.cards.length !== expectedTrickSize) {
        return {
          ...state,
          hands: newHands,
          currentTrick: updatedTrick,
          currentPlayerId: getNextPlayerWithAlone(
            playerId,
            state.players,
            state.maker
          ),
        };
      }

      const leadSuit = state.trump
        ? getEffectiveSuit(updatedTrick.cards[0].card, state.trump)
        : updatedTrick.cards[0].card.suit;

      const winningPlay = getWinningCard(
        updatedTrick.cards,
        state.trump!,
        leadSuit
      );
      updatedTrick.winnerId = winningPlay.playerId;

      const newCompletedTricks = [...state.completedTricks, updatedTrick];

      if (newCompletedTricks.length !== 5) {
        return {
          ...state,
          hands: newHands,
          currentTrick: undefined,
          completedTricks: newCompletedTricks,
          phase: 'trick_complete',
          currentPlayerId: winningPlay.playerId,
        };
      }

      if (!state.maker) return state;

      const handScores = calculateHandScore(
        newCompletedTricks,
        state.players,
        state.maker.teamId,
        state.maker.alone
      );

      const newScores = {
        team0: state.scores.team0 + handScores.team0,
        team1: state.scores.team1 + handScores.team1,
      };

      // Check for game end (first to 10 points wins)
      const gameComplete = newScores.team0 >= 10 || newScores.team1 >= 10;

      return {
        ...state,
        handScores,
        hands: newHands,
        currentTrick: undefined,
        completedTricks: newCompletedTricks,
        currentPlayerId: winningPlay.playerId,
        scores: newScores,
        phase: gameComplete ? 'game_complete' : 'hand_complete',
      };
    }

    case 'COMPLETE_TRICK':
      return {
        ...state,
        phase: 'playing',
      };

    case 'COMPLETE_HAND': {
      // Scores should already be calculated in CALCULATE_HAND_SCORE
      // This action now just transitions to the next hand or keeps the current state
      return {
        ...state,
        phase: 'dealing_animation',
        currentDealerId: getNextDealer(state.currentDealerId, state.players),
        completedTricks: [],
        trump: undefined,
        maker: undefined,
        bids: [],
        hands: state.phase === 'game_complete' ? state.hands : {},
        currentTrick: undefined,
        turnedDownSuit: undefined,
        handScores: { team0: 0, team1: 0 },
      };
    }

    case 'NEXT_HAND':
      return {
        ...state,
        phase: 'dealing_animation',
        currentDealerId: getNextDealer(state.currentDealerId, state.players),
        completedTricks: [],
        trump: undefined,
        maker: undefined,
        bids: [],
        hands: {},
        currentTrick: undefined,
        turnedDownSuit: undefined,
        handScores: { team0: 0, team1: 0 },
      };

    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayerId: action.payload.playerId,
      };

    case 'SET_PHASE':
      return {
        ...state,
        phase: action.payload.phase,
      };

    case 'RESTORE_GAME_STATE': {
      // Completely restore the game state (for host reconnection)
      const { gameState } = action.payload;
      return gameState;
    }

    case 'SYNC_STATE': {
      const { gameState, playerHand, receivingPlayerId } = action.payload;

      return {
        ...state,
        id: gameState.id,
        players: gameState.players,
        teamNames: gameState.teamNames,
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
        deck: gameState.deck,
        farmersHandPlayer: gameState.farmersHandPlayer,
      };
    }

    case 'RENAME_PLAYER':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, name: action.payload.newName }
            : p
        ),
      };

    case 'RENAME_TEAM':
      return {
        ...state,
        teamNames: {
          ...state.teamNames,
          [`team${action.payload.teamId}`]: action.payload.newName,
        },
      };

    case 'KICK_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.playerId),
      };

    case 'MOVE_PLAYER': {
      const { playerId, newPosition } = action.payload;
      const playerToMove = state.players.find(p => p.id === playerId);
      if (!playerToMove) return state;

      // Find if there's already a player at the target position
      const playerAtTarget = state.players.find(
        p => p.position === newPosition
      );

      const updatedPlayers = state.players.map(p => {
        if (p.id === playerId) {
          // Move the player to new position and update team
          return {
            ...p,
            position: newPosition,
            teamId: (newPosition % 2) as 0 | 1,
          };
        } else if (playerAtTarget && p.id === playerAtTarget.id) {
          // Swap with the player at target position
          return {
            ...p,
            position: playerToMove.position,
            teamId: (playerToMove.position % 2) as 0 | 1,
          };
        }
        return p;
      });

      return {
        ...state,
        players: updatedPlayers,
      };
    }

    case 'UPDATE_GAME_OPTIONS': {
      // Only allow changing options in lobby phase
      if (state.phase !== 'lobby') {
        return state;
      }

      return {
        ...state,
        options: action.payload.options,
      };
    }

    default:
      return state;
  }
}

export function createPublicGameState(
  gameState: GameState,
  forPlayerId?: string
): PublicGameState {
  // Create placeholder cards for the deck - clients only see placeholders for security
  const placeholderCards: Card[] = Array.from(
    { length: gameState.deck.length },
    (_, index) => ({
      id: `placeholder-${index}`,
      suit: 'spades' as const,
      value: 'A' as const,
    })
  );

  const publicState: PublicGameState = {
    id: gameState.id,
    gameCode: gameState.gameCode,
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
    teamNames: gameState.teamNames,
    maker: gameState.maker,
    farmersHandPlayer: gameState.farmersHandPlayer,
    dealerSelectionCards: gameState.dealerSelectionCards,
    firstBlackJackDealing: gameState.firstBlackJackDealing,
    deck: placeholderCards,
  };

  // Include player's hand if specified
  if (forPlayerId && gameState.hands[forPlayerId]) {
    publicState.playerHand = gameState.hands[forPlayerId];
  }

  return publicState;
}

export function isDealerScrewed(gameState: GameState): boolean {
  // Only applies in round 2 with screw-the-dealer enabled
  if (
    gameState.phase !== 'bidding_round2' ||
    !gameState.options.screwTheDealer
  ) {
    return false;
  }

  // Check if current player is the dealer
  if (gameState.currentPlayerId !== gameState.currentDealerId) {
    return false;
  }

  // In round 2, the dealer is screwed if everyone else has passed
  // We need to count how many players have passed since round 2 started

  // Find where round 2 started (when the dealer passed at the end of round 1)
  const round1Passes = gameState.players.length; // Each player passes once in round 1
  const round2Bids = gameState.bids.slice(round1Passes); // Bids from round 2

  // Count how many non-dealer players have passed in round 2
  const round2Passes = round2Bids.filter(
    bid => bid.suit === 'pass' && bid.playerId !== gameState.currentDealerId
  ).length;

  // If all 3 other players have passed in round 2, dealer is screwed
  return round2Passes === 3;
}
